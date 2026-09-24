import io
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.models.category import Category
from app.models.location import Location
from app.models.user import User, UserRole


def create_user_with_token(client: TestClient, name: str, email: str, role: UserRole) -> dict[str, str]:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=email.lower(),
            password_hash=hash_password("Password123!"),
            role=role.value,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(str(user.id))
        return {
            "id": str(user.id),
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
        }
    finally:
        db.close()


def test_category_and_location_management(client: TestClient):
    admin = create_user_with_token(client, "Admin", "admin@test.edu", UserRole.ADMIN)
    student = create_user_with_token(client, "Student", "student@test.edu", UserRole.STUDENT)

    # Student cannot create category
    res = client.post(
        "/api/v1/categories",
        headers=student["headers"],
        json={"name": "CIVIL", "description": "Civil issues"},
    )
    assert res.status_code == 403

    # Admin can create category
    res = client.post(
        "/api/v1/categories",
        headers=admin["headers"],
        json={"name": "CIVIL", "description": "Civil issues"},
    )
    assert res.status_code == 201
    cat_id = res.json()["id"]

    # Admin can create location
    res = client.post(
        "/api/v1/locations",
        headers=admin["headers"],
        json={"name": "Main Library", "description": "Central reading area"},
    )
    assert res.status_code == 201
    loc_id = res.json()["id"]

    # Public can list active categories and locations
    cat_list = client.get("/api/v1/categories").json()
    assert any(c["name"] == "CIVIL" for c in cat_list)

    loc_list = client.get("/api/v1/locations").json()
    assert any(l["name"] == "Main Library" for l in loc_list)


def test_issue_lifecycle_workflow(client: TestClient):
    admin = create_user_with_token(client, "Admin", "admin@test.edu", UserRole.ADMIN)
    maint = create_user_with_token(client, "Technician", "tech@test.edu", UserRole.MAINTENANCE)
    student = create_user_with_token(client, "Student", "student@test.edu", UserRole.STUDENT)

    # 1. Setup master data
    cat_res = client.post(
        "/api/v1/categories",
        headers=admin["headers"],
        json={"name": "ELECTRICAL", "description": "Power and fans"},
    ).json()
    loc_res = client.post(
        "/api/v1/locations",
        headers=admin["headers"],
        json={"name": "Classroom 101", "description": "1st floor"},
    ).json()

    # 2. Student reports an issue
    issue_payload = {
        "title": "Broken fan in Classroom 101",
        "description": "Fan is making loud buzzing noise and not rotating.",
        "category_id": cat_res["id"],
        "location_id": loc_res["id"],
    }
    report_res = client.post("/api/v1/issues", headers=student["headers"], json=issue_payload)
    assert report_res.status_code == 201
    issue_data = report_res.json()
    issue_id = issue_data["id"]
    assert issue_data["status"] == "OPEN"
    assert issue_data["priority"] == "LOW"

    # Reporter received notification
    notif_res = client.get("/api/v1/notifications", headers=student["headers"]).json()
    assert notif_res["unread_count"] >= 1

    # 3. Similar issues search finds this issue
    sim_res = client.get(
        f"/api/v1/issues/similar?category_id={cat_res['id']}&location_id={loc_res['id']}"
    )
    assert sim_res.status_code == 200
    assert any(s["id"] == issue_id for s in sim_res.json())

    # 4. Student cannot verify or set priority
    assert client.post(f"/api/v1/issues/{issue_id}/verify", headers=student["headers"]).status_code == 403
    assert client.post(f"/api/v1/issues/{issue_id}/priority", headers=student["headers"], json={"priority": "HIGH"}).status_code == 403

    # 5. Admin sets priority to HIGH and verifies
    prio_res = client.post(
        f"/api/v1/issues/{issue_id}/priority",
        headers=admin["headers"],
        json={"priority": "HIGH"},
    )
    assert prio_res.status_code == 200
    assert prio_res.json()["priority"] == "HIGH"

    verify_res = client.post(
        f"/api/v1/issues/{issue_id}/verify",
        headers=admin["headers"],
        json={"message": "Verified by campus engineer"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"

    # 6. Admin assigns issue to Maintenance technician
    assign_res = client.post(
        f"/api/v1/issues/{issue_id}/assign",
        headers=admin["headers"],
        json={"assigned_to": maint["id"], "message": "Please fix by evening"},
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "ASSIGNED"

    # Maintenance technician received notification
    maint_notifs = client.get("/api/v1/notifications", headers=maint["headers"]).json()
    assert maint_notifs["unread_count"] >= 1

    # 7. Issue cannot be resolved directly from ASSIGNED without IN_PROGRESS
    invalid_resolve = client.post(
        f"/api/v1/issues/{issue_id}/resolve",
        headers=maint["headers"],
        json={"resolution_note": "Done"},
    )
    assert invalid_resolve.status_code == 400

    # 8. Maintenance technician starts work
    start_res = client.post(f"/api/v1/maintenance/{issue_id}/start-work", headers=maint["headers"])
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 9. Maintenance technician resolves issue with resolution note
    resolve_res = client.post(
        f"/api/v1/issues/{issue_id}/resolve",
        headers=maint["headers"],
        json={"resolution_note": "Replaced faulty capacitor and balanced blades."},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    assert resolve_res.json()["resolved_at"] is not None


def test_rejection_workflow(client: TestClient):
    admin = create_user_with_token(client, "Admin", "admin@test.edu", UserRole.ADMIN)
    student = create_user_with_token(client, "Student", "student@test.edu", UserRole.STUDENT)

    cat = client.post("/api/v1/categories", headers=admin["headers"], json={"name": "OTHER"}).json()
    loc = client.post("/api/v1/locations", headers=admin["headers"], json={"name": "Auditorium"}).json()

    rep = client.post(
        "/api/v1/issues",
        headers=student["headers"],
        json={"title": "Personal item lost in auditorium", "description": "Left my jacket on chair 5", "category_id": cat["id"], "location_id": loc["id"]},
    ).json()

    # Rejection requires reason
    bad_reject = client.post(f"/api/v1/issues/{rep['id']}/reject", headers=admin["headers"], json={"reason": ""})
    assert bad_reject.status_code == 422  # validation error for min_length

    # Valid rejection
    reject_res = client.post(
        f"/api/v1/issues/{rep['id']}/reject",
        headers=admin["headers"],
        json={"reason": "Campus360 is for infrastructure defects. Please contact lost and found desk."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"


def test_comments_and_supports(client: TestClient):
    admin = create_user_with_token(client, "Admin", "admin@test.edu", UserRole.ADMIN)
    student1 = create_user_with_token(client, "Student1", "student1@test.edu", UserRole.STUDENT)
    student2 = create_user_with_token(client, "Student2", "student2@test.edu", UserRole.STUDENT)

    cat = client.post("/api/v1/categories", headers=admin["headers"], json={"name": "PLUMBING"}).json()
    loc = client.post("/api/v1/locations", headers=admin["headers"], json={"name": "Canteen"}).json()

    issue = client.post(
        "/api/v1/issues",
        headers=student1["headers"],
        json={"title": "Canteen tap broken", "description": "Water pouring continuously from sink tap", "category_id": cat["id"], "location_id": loc["id"]},
    ).json()
    issue_id = issue["id"]

    # 1. Student2 supports issue
    sup_res = client.post(f"/api/v1/issues/{issue_id}/support", headers=student2["headers"])
    assert sup_res.status_code == 200
    assert sup_res.json()["support_count"] == 1

    # Duplicate support prevention
    dup_res = client.post(f"/api/v1/issues/{issue_id}/support", headers=student2["headers"])
    assert dup_res.status_code == 409

    # Remove support
    rem_res = client.delete(f"/api/v1/issues/{issue_id}/support", headers=student2["headers"])
    assert rem_res.status_code == 200
    assert rem_res.json()["support_count"] == 0

    # 2. Add comment
    cmt_res = client.post(
        f"/api/v1/issues/{issue_id}/comments",
        headers=student2["headers"],
        json={"comment": "I saw this too, water is flooding the tile floor."},
    )
    assert cmt_res.status_code == 201
    cmt_id = cmt_res.json()["id"]

    # Student1 cannot edit Student2's comment
    edit_fail = client.patch(
        f"/api/v1/issues/{issue_id}/comments/{cmt_id}",
        headers=student1["headers"],
        json={"comment": "Hacked"},
    )
    assert edit_fail.status_code == 403

    # Student2 can edit own comment
    edit_ok = client.patch(
        f"/api/v1/issues/{issue_id}/comments/{cmt_id}",
        headers=student2["headers"],
        json={"comment": "Updated: water is flooding the tile floor."},
    )
    assert edit_ok.status_code == 200

    # Admin can moderate (delete) comment
    mod_res = client.delete(f"/api/v1/issues/{issue_id}/comments/{cmt_id}", headers=admin["headers"])
    assert mod_res.status_code == 200


def test_analytics_and_audit(client: TestClient):
    admin = create_user_with_token(client, "Admin", "admin@test.edu", UserRole.ADMIN)
    student = create_user_with_token(client, "Student", "student@test.edu", UserRole.STUDENT)

    # Non-admin cannot view analytics
    assert client.get("/api/v1/admin/analytics", headers=student["headers"]).status_code == 403

    # Admin views analytics
    analytics_res = client.get("/api/v1/admin/analytics", headers=admin["headers"])
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "summary" in data
    assert "by_status" in data
    assert "reports_over_time" in data

    # Admin views audit logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers=admin["headers"])
    assert audit_res.status_code == 200
    assert "items" in audit_res.json()


def test_image_upload_validation(client: TestClient):
    student = create_user_with_token(client, "Student", "student@test.edu", UserRole.STUDENT)

    # Valid image upload (fake png bytes with valid header)
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    up_res = client.post("/api/v1/issues/upload", headers=student["headers"], files=files)
    assert up_res.status_code == 200
    assert up_res.json()["url"].startswith("/uploads/")

    # Invalid extension rejected
    files_bad = {"file": ("script.sh", io.BytesIO(b"echo 1"), "text/plain")}
    bad_res = client.post("/api/v1/issues/upload", headers=student["headers"], files=files_bad)
    assert bad_res.status_code == 400
