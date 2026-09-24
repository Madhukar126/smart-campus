def test_health_reports_connected_database(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_register_login_and_read_current_user(client):
    registration = {
        "name": "Ananya Rao",
        "email": "ananya@example.edu",
        "password": "campus123",
        "role": "STUDENT",
    }
    created = client.post("/api/v1/auth/register", json=registration)
    assert created.status_code == 201
    assert created.json()["email"] == registration["email"]
    assert "password" not in created.json()

    duplicate = client.post("/api/v1/auth/register", json=registration)
    assert duplicate.status_code == 409

    login = client.post(
        "/api/v1/auth/login",
        json={"email": registration["email"], "password": registration["password"]},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"] == registration["name"]


def test_invalid_login_and_protected_route(client):
    invalid = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.edu", "password": "incorrect"},
    )
    assert invalid.status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_public_registration_rejects_privileged_role(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Unexpected Admin",
            "email": "admin@example.edu",
            "password": "campus123",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 422

