"""Campus360 deterministic seed data generator.

Safe to run multiple times without duplicating data.
"""
from datetime import datetime, timezone, timedelta
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.assignment import Assignment
from app.models.audit_log import AuditLog
from app.models.category import Category
from app.models.comment import Comment
from app.models.issue import ImageType, Issue, IssuePriority, IssueStatus
from app.models.issue_image import IssueImage
from app.models.issue_support import IssueSupport
from app.models.issue_update import IssueUpdate
from app.models.location import Location
from app.models.notification import Notification
from app.models.user import User, UserRole

DEFAULT_PASSWORD = "CampusPassword123!"

SEED_USERS = [
    # Admin & Leadership
    {"name": "System Administrator", "email": "admin@campus360.edu", "role": UserRole.ADMIN},
    {"name": "Administrative Officer Raman", "email": "ao@campus360.edu", "role": UserRole.AO},
    {"name": "Dr. Sarah Jenkins (Principal)", "email": "principal@campus360.edu", "role": UserRole.PRINCIPAL},
    # Maintenance Staff
    {"name": "Murugan Electrical", "email": "murugan.maint@campus360.edu", "role": UserRole.MAINTENANCE},
    {"name": "Ravi Plumbing & Civils", "email": "ravi.maint@campus360.edu", "role": UserRole.MAINTENANCE},
    {"name": "David IT Support", "email": "david.maint@campus360.edu", "role": UserRole.MAINTENANCE},
    # Staff
    {"name": "Prof. Alan Turing", "email": "alan.staff@campus360.edu", "role": UserRole.STAFF},
    {"name": "Dr. Ada Lovelace", "email": "ada.staff@campus360.edu", "role": UserRole.STAFF},
    # Students
    {"name": "Rahul Sharma", "email": "rahul.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Priya Patel", "email": "priya.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Ananya Reddy", "email": "ananya.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Karthik Raja", "email": "karthik.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Sneha Iyer", "email": "sneha.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Vikram Singh", "email": "vikram.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Deepika Das", "email": "deepika.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Rohan Verma", "email": "rohan.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Meera Nair", "email": "meera.student@campus360.edu", "role": UserRole.STUDENT},
    {"name": "Arjun Kumar", "email": "arjun.student@campus360.edu", "role": UserRole.STUDENT},
]

SEED_CATEGORIES = [
    {"name": "INFRASTRUCTURE", "description": "Buildings, pathways, furniture, and physical civil structures"},
    {"name": "ELECTRICAL", "description": "Lights, fans, switchboards, wires, and power outlets"},
    {"name": "PLUMBING", "description": "Taps, pipes, leakage, water coolers, and drainage"},
    {"name": "CLEANLINESS", "description": "Garbage, restrooms, corridors, and sanitation"},
    {"name": "IT_WIFI", "description": "Campus Wi-Fi, LAN connections, lab PCs, and network switches"},
    {"name": "CLASSROOM", "description": "Projectors, smartboards, benches, and podiums"},
    {"name": "LIBRARY", "description": "Reading room facilities, book racks, and digital kiosks"},
    {"name": "CANTEEN", "description": "Dining tables, food hygiene, water dispensers, and waste bins"},
    {"name": "HOSTEL", "description": "Hostel rooms, water heaters, mess facilities, and corridors"},
    {"name": "TRANSPORT", "description": "College buses, bus shelters, and parking bays"},
    {"name": "SAFETY", "description": "Fire extinguishers, emergency exits, railings, and security cameras"},
    {"name": "OTHER", "description": "Miscellaneous or unclassified campus issues"},
]

SEED_LOCATIONS = [
    {"name": "Main Block", "description": "Administrative offices and central lobby"},
    {"name": "Data Science Block", "description": "DS department labs and lecture halls"},
    {"name": "AI and DS Block", "description": "Artificial Intelligence & Data Science wing"},
    {"name": "Library", "description": "Central campus library and digital reference center"},
    {"name": "Canteen", "description": "Main student and faculty dining complex"},
    {"name": "Boys Hostel", "description": "Men's residential block and perimeter"},
    {"name": "Girls Hostel", "description": "Women's residential block and quadrangle"},
    {"name": "Main Gate", "description": "Primary campus entrance and security post"},
    {"name": "Bus Stop", "description": "Campus bus pickup and transit shelter"},
    {"name": "Parking Area", "description": "Two-wheeler and four-wheeler vehicle parking"},
    {"name": "Sports Ground", "description": "Athletic track, football turf, and basketball courts"},
    {"name": "Auditorium", "description": "Grand auditorium and seminar hall complex"},
    {"name": "Classroom 203", "description": "Second floor lecture theatre in Main Block"},
]

SAMPLE_ISSUES = [
    {
        "title": "Broken bench near bus stop shelter",
        "description": "The wooden slat on the front seating bench at the campus bus stop is cracked and poses an injury risk to waiting students.",
        "category": "INFRASTRUCTURE",
        "location": "Bus Stop",
        "reporter": "rahul.student@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 6,
        "assigned_to": "ravi.maint@campus360.edu",
        "resolution_note": "Replaced cracked wooden slats with new treated teakwood plank and varnished.",
    },
    {
        "title": "Severe water leakage near 1st floor washroom",
        "description": "Continuous pipe leakage under the sink in the Main Block 1st floor men's restroom causes slippery floor surfaces.",
        "category": "PLUMBING",
        "location": "Main Block",
        "reporter": "priya.student@campus360.edu",
        "status": IssueStatus.IN_PROGRESS,
        "priority": IssuePriority.HIGH,
        "days_ago": 2,
        "assigned_to": "ravi.maint@campus360.edu",
    },
    {
        "title": "Campus Wi-Fi connectivity dropping in Library 2nd floor",
        "description": "The access point 'Campus-Lib-AP02' continuously disconnects students attempting to access digital journals.",
        "category": "IT_WIFI",
        "location": "Library",
        "reporter": "ananya.student@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 3,
        "assigned_to": "david.maint@campus360.edu",
    },
    {
        "title": "Ceiling fan making loud scraping sound in Classroom 203",
        "description": "The middle fan in row 3 is vibrating violently and rattling loudly during lectures, causing high disturbance.",
        "category": "ELECTRICAL",
        "location": "Classroom 203",
        "reporter": "alan.staff@campus360.edu",
        "status": IssueStatus.VERIFIED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 1,
    },
    {
        "title": "Overflowing waste bins outside canteen food court",
        "description": "The wet-waste and dry-waste bins behind the canteen counter are overflowing and attracting stray birds and insects.",
        "category": "CLEANLINESS",
        "location": "Canteen",
        "reporter": "karthik.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.LOW,
        "days_ago": 0,
    },
    {
        "title": "Flickering street light along Parking Area pathway",
        "description": "Pole lamp #14 at the parking lot entrance is flickering intermittently, leaving the corner completely dark after 7 PM.",
        "category": "ELECTRICAL",
        "location": "Parking Area",
        "reporter": "sneha.student@campus360.edu",
        "status": IssueStatus.IN_PROGRESS,
        "priority": IssuePriority.HIGH,
        "days_ago": 4,
        "assigned_to": "murugan.maint@campus360.edu",
    },
    {
        "title": "Overheating HDMI projector in Classroom 203",
        "description": "Projector powers down automatically with an overheating warning after 15 minutes of continuous presentation display.",
        "category": "CLASSROOM",
        "location": "Classroom 203",
        "reporter": "ada.staff@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.HIGH,
        "days_ago": 2,
        "assigned_to": "david.maint@campus360.edu",
    },
    {
        "title": "Blocked storm drainage near Boys Hostel entrance",
        "description": "Leaves and debris have clogged the rainwater drain, causing stagnant water accumulation during evening rains.",
        "category": "PLUMBING",
        "location": "Boys Hostel",
        "reporter": "vikram.student@campus360.edu",
        "status": IssueStatus.VERIFIED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 2,
    },
    {
        "title": "Broken handrail on exterior staircase of AI and DS Block",
        "description": "The metal railing between ground and first floor is detached at the anchor bracket, creating a safety hazard.",
        "category": "SAFETY",
        "location": "AI and DS Block",
        "reporter": "deepika.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 1,
    },
    {
        "title": "Pot hole on pathway leading to Sports Ground",
        "description": "Heavy rain caused paver block collapse on the walkway. Students on bicycles and pedestrians frequently stumble.",
        "category": "INFRASTRUCTURE",
        "location": "Sports Ground",
        "reporter": "rohan.student@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 8,
        "assigned_to": "ravi.maint@campus360.edu",
        "resolution_note": "Recompacted aggregate base and relaid interlocking concrete pavers.",
    },
    {
        "title": "Drinking water cooler cooling mechanism failure",
        "description": "The 2nd floor water cooler in Data Science Block dispenses room-temperature water despite the refrigeration switch being active.",
        "category": "PLUMBING",
        "location": "Data Science Block",
        "reporter": "meera.student@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.LOW,
        "days_ago": 3,
        "assigned_to": "ravi.maint@campus360.edu",
    },
    {
        "title": "Auditorium side stage microphone echo and feedback",
        "description": "Right side lavalier microphone channel 4 has heavy static interference during rehearsals.",
        "category": "OTHER",
        "location": "Auditorium",
        "reporter": "arjun.student@campus360.edu",
        "status": IssueStatus.REJECTED,
        "priority": IssuePriority.LOW,
        "days_ago": 5,
        "rejection_reason": "Not an infrastructure defect. Sound check equipment setup was scheduled for next week with external vendor.",
    },
    {
        "title": "Loose electrical switchboard in DS Computer Lab 3",
        "description": "The 3-gang power socket near workstation 18 is hanging loose from the casing with exposed live wires.",
        "category": "ELECTRICAL",
        "location": "Data Science Block",
        "reporter": "rahul.student@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 5,
        "assigned_to": "murugan.maint@campus360.edu",
        "resolution_note": "Replaced faceplate, rewired terminal block, and secured with new anchor plugs.",
    },
    {
        "title": "Broken window glass latch in Girls Hostel study room",
        "description": "Window sash cannot be closed or latched securely, allowing rain mist to enter and blow across study tables.",
        "category": "HOSTEL",
        "location": "Girls Hostel",
        "reporter": "priya.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.LOW,
        "days_ago": 1,
    },
    {
        "title": "Expired fire extinguisher in Auditorium lobby",
        "description": "Inspection tag indicates chemical fire extinguisher unit ABC-04 was due for pressure recharge last month.",
        "category": "SAFETY",
        "location": "Auditorium",
        "reporter": "ananya.student@campus360.edu",
        "status": IssueStatus.VERIFIED,
        "priority": IssuePriority.HIGH,
        "days_ago": 3,
    },
    {
        "title": "Broken chain on campus perimeter gate near Main Gate",
        "description": "Auxiliary pedestrian gate latch has snapped and cannot be locked at night.",
        "category": "SAFETY",
        "location": "Main Gate",
        "reporter": "karthik.student@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 9,
        "assigned_to": "ravi.maint@campus360.edu",
        "resolution_note": "Fitted new heavy-duty brass padlock latch and reinforced welded hinges.",
    },
    {
        "title": "Water dripping from AC compressor unit in Library lobby",
        "description": "Condensate drain line is detached, dripping directly over the entry carpet and creating musty smell.",
        "category": "PLUMBING",
        "location": "Library",
        "reporter": "sneha.student@campus360.edu",
        "status": IssueStatus.IN_PROGRESS,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 2,
        "assigned_to": "ravi.maint@campus360.edu",
    },
    {
        "title": "Broken chair armrests in Seminar Hall 203",
        "description": "Three cushioned chairs in the front row have splintered wooden armrests.",
        "category": "CLASSROOM",
        "location": "Classroom 203",
        "reporter": "vikram.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.LOW,
        "days_ago": 0,
    },
    {
        "title": "Defective bus door pneumatic release on Bus #12",
        "description": "Front entry pneumatic door sticks halfway when opening at the main bus stop.",
        "category": "TRANSPORT",
        "location": "Bus Stop",
        "reporter": "deepika.student@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 1,
        "assigned_to": "murugan.maint@campus360.edu",
    },
    {
        "title": "Low water pressure in Boys Hostel 3rd floor showers",
        "description": "Only a trickle of water is available during morning peak hours (7 AM - 9 AM).",
        "category": "HOSTEL",
        "location": "Boys Hostel",
        "reporter": "rohan.student@campus360.edu",
        "status": IssueStatus.VERIFIED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 4,
    },
    {
        "title": "Cracked bathroom mirror in Main Block ground floor",
        "description": "Full length mirror has a diagonal crack across the top half with sharp edges exposed.",
        "category": "CLEANLINESS",
        "location": "Main Block",
        "reporter": "meera.student@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 7,
        "assigned_to": "ravi.maint@campus360.edu",
        "resolution_note": "Replaced mirror with new beveled safety glass mirror.",
    },
    {
        "title": "Overgrown tree branches touching power line near Sports Ground",
        "description": "Heavy boughs from banyan tree are resting on overhead three-phase power cable.",
        "category": "SAFETY",
        "location": "Sports Ground",
        "reporter": "arjun.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 0,
    },
    {
        "title": "Exhaust fan not working in Canteen kitchen annex",
        "description": "Industrial exhaust motor hums without blade rotation, leading to smoke buildup inside food prep room.",
        "category": "ELECTRICAL",
        "location": "Canteen",
        "reporter": "alan.staff@campus360.edu",
        "status": IssueStatus.IN_PROGRESS,
        "priority": IssuePriority.HIGH,
        "days_ago": 3,
        "assigned_to": "murugan.maint@campus360.edu",
    },
    {
        "title": "Broken roller blind in Library journal reading section",
        "description": "Spring mechanism is jammed and blind cannot be lowered, causing heavy afternoon sun glare.",
        "category": "LIBRARY",
        "location": "Library",
        "reporter": "ada.staff@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.LOW,
        "days_ago": 2,
    },
    {
        "title": "Two burnt out flood lights on Basketball court",
        "description": "East side high-mast LED fixture #2 and #3 are completely dead, preventing evening intramural matches.",
        "category": "ELECTRICAL",
        "location": "Sports Ground",
        "reporter": "rahul.student@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 2,
        "assigned_to": "murugan.maint@campus360.edu",
    },
    {
        "title": "Damaged asphalt surface and deep rut in Parking Area",
        "description": "Heavy truck deliveries caused 3-meter sunken depression where rainwater collects.",
        "category": "INFRASTRUCTURE",
        "location": "Parking Area",
        "reporter": "priya.student@campus360.edu",
        "status": IssueStatus.VERIFIED,
        "priority": IssuePriority.LOW,
        "days_ago": 5,
    },
    {
        "title": "Audio amplifier buzzing sound in Auditorium main speakers",
        "description": "Noticeable 60Hz mains ground hum audible through line array speakers when podium is powered.",
        "category": "OTHER",
        "location": "Auditorium",
        "reporter": "ananya.student@campus360.edu",
        "status": IssueStatus.ASSIGNED,
        "priority": IssuePriority.MEDIUM,
        "days_ago": 1,
        "assigned_to": "david.maint@campus360.edu",
    },
    {
        "title": "Canteen water dispenser hot tap leaking scalding water",
        "description": "Hot water tap valve doesn't shut completely and drips continuously into drip tray.",
        "category": "CANTEEN",
        "location": "Canteen",
        "reporter": "karthik.student@campus360.edu",
        "status": IssueStatus.IN_PROGRESS,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 1,
        "assigned_to": "ravi.maint@campus360.edu",
    },
    {
        "title": "Broken window pane in Data Science Server Room",
        "description": "Lower glass cracked during storm winds. Dust ingress is threatening server rack temperatures.",
        "category": "IT_WIFI",
        "location": "Data Science Block",
        "reporter": "alan.staff@campus360.edu",
        "status": IssueStatus.RESOLVED,
        "priority": IssuePriority.CRITICAL,
        "days_ago": 10,
        "assigned_to": "ravi.maint@campus360.edu",
        "resolution_note": "Installed double-glazed sealed acrylic window panel and silicone weatherproof sealant.",
    },
    {
        "title": "Broken bicycle rack near AI and DS Block entrance",
        "description": "One section of metal bike rack has bent tubes preventing students from locking front tires.",
        "category": "INFRASTRUCTURE",
        "location": "AI and DS Block",
        "reporter": "sneha.student@campus360.edu",
        "status": IssueStatus.OPEN,
        "priority": IssuePriority.LOW,
        "days_ago": 0,
    },
]


def seed_database(db: Session) -> dict[str, int]:
    counts = {"users": 0, "categories": 0, "locations": 0, "issues": 0}
    now = datetime.now(timezone.utc)

    # 1. Seed Users
    user_map: dict[str, User] = {}
    for user_data in SEED_USERS:
        email = user_data["email"].lower()
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(
                name=user_data["name"],
                email=email,
                password_hash=hash_password(DEFAULT_PASSWORD),
                role=user_data["role"].value,
                is_active=True,
            )
            db.add(user)
            db.flush()
            counts["users"] += 1
        user_map[email] = user

    # 2. Seed Categories
    category_map: dict[str, Category] = {}
    for cat_data in SEED_CATEGORIES:
        name = cat_data["name"].upper()
        cat = db.scalar(select(Category).where(Category.name == name))
        if not cat:
            cat = Category(
                name=name,
                description=cat_data["description"],
                is_active=True,
            )
            db.add(cat)
            db.flush()
            counts["categories"] += 1
        category_map[name] = cat

    # 3. Seed Locations
    location_map: dict[str, Location] = {}
    for loc_data in SEED_LOCATIONS:
        name = loc_data["name"]
        loc = db.scalar(select(Location).where(Location.name == name))
        if not loc:
            loc = Location(
                name=name,
                description=loc_data["description"],
                is_active=True,
            )
            db.add(loc)
            db.flush()
            counts["locations"] += 1
        location_map[name] = loc

    admin_user = user_map["admin@campus360.edu"]

    # 4. Seed Issues
    all_students = [u for u in user_map.values() if u.role == UserRole.STUDENT.value]

    for item in SAMPLE_ISSUES:
        existing = db.scalar(select(Issue).where(Issue.title == item["title"]))
        if existing:
            continue

        reporter = user_map.get(item["reporter"]) or admin_user
        cat = category_map[item["category"]]
        loc = location_map[item["location"]]
        created_time = now - timedelta(days=item.get("days_ago", 0), hours=3)

        issue = Issue(
            reported_by=reporter.id,
            title=item["title"],
            description=item["description"],
            category_id=cat.id,
            location_id=loc.id,
            status=item["status"].value,
            priority=item["priority"].value,
            created_at=created_time,
            updated_at=created_time + timedelta(hours=2),
            resolved_at=(created_time + timedelta(days=1)) if item["status"] == IssueStatus.RESOLVED else None,
        )
        db.add(issue)
        db.flush()
        counts["issues"] += 1

        # Initial report image
        report_img = IssueImage(
            issue_id=issue.id,
            image_url=f"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            image_type=ImageType.REPORT.value,
            uploaded_by=reporter.id,
            created_at=created_time,
        )
        db.add(report_img)

        # Initial Update
        db.add(
            IssueUpdate(
                issue_id=issue.id,
                user_id=reporter.id,
                old_status=None,
                new_status=IssueStatus.OPEN.value,
                message="Issue reported by " + reporter.name,
                created_at=created_time,
            )
        )

        # Assignments if status involves maintenance
        if "assigned_to" in item and item["assigned_to"] in user_map:
            assignee = user_map[item["assigned_to"]]
            assignment_status = "COMPLETED" if item["status"] == IssueStatus.RESOLVED else "ACTIVE"
            assignment = Assignment(
                issue_id=issue.id,
                assigned_to=assignee.id,
                assigned_by=admin_user.id,
                assigned_at=created_time + timedelta(hours=1),
                status=assignment_status,
            )
            db.add(assignment)

            db.add(
                IssueUpdate(
                    issue_id=issue.id,
                    user_id=admin_user.id,
                    old_status=IssueStatus.VERIFIED.value,
                    new_status=IssueStatus.ASSIGNED.value,
                    message=f"Assigned to {assignee.name}",
                    created_at=created_time + timedelta(hours=1),
                )
            )

        # In-Progress update
        if item["status"] in (IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED):
            assignee_user = user_map.get(item.get("assigned_to", "murugan.maint@campus360.edu")) or admin_user
            db.add(
                IssueUpdate(
                    issue_id=issue.id,
                    user_id=assignee_user.id,
                    old_status=IssueStatus.ASSIGNED.value,
                    new_status=IssueStatus.IN_PROGRESS.value,
                    message="Inspected on-site; work commenced.",
                    created_at=created_time + timedelta(hours=4),
                )
            )

        # Resolved update & image
        if item["status"] == IssueStatus.RESOLVED:
            assignee_user = user_map.get(item.get("assigned_to", "murugan.maint@campus360.edu")) or admin_user
            db.add(
                IssueUpdate(
                    issue_id=issue.id,
                    user_id=assignee_user.id,
                    old_status=IssueStatus.IN_PROGRESS.value,
                    new_status=IssueStatus.RESOLVED.value,
                    message=item.get("resolution_note", "Work completed and tested."),
                    created_at=issue.resolved_at or now,
                )
            )
            res_img = IssueImage(
                issue_id=issue.id,
                image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
                image_type=ImageType.RESOLUTION.value,
                uploaded_by=assignee_user.id,
                created_at=issue.resolved_at or now,
            )
            db.add(res_img)

        # Rejection update
        if item["status"] == IssueStatus.REJECTED:
            db.add(
                IssueUpdate(
                    issue_id=issue.id,
                    user_id=admin_user.id,
                    old_status=IssueStatus.OPEN.value,
                    new_status=IssueStatus.REJECTED.value,
                    message=item.get("rejection_reason", "Not approved."),
                    created_at=created_time + timedelta(hours=2),
                )
            )

        # Add realistic community supports (1 to 5 students support each issue)
        num_supports = (hash(item["title"]) % 5) + 1
        for supporter in all_students[:num_supports]:
            if supporter.id != reporter.id:
                support = IssueSupport(
                    issue_id=issue.id,
                    user_id=supporter.id,
                    created_at=created_time + timedelta(hours=1),
                )
                db.add(support)

        # Add realistic comments
        db.add(
            Comment(
                issue_id=issue.id,
                user_id=reporter.id,
                comment="Thank you for taking this up quickly!",
                created_at=created_time + timedelta(hours=2),
            )
        )

        # Audit log for creation
        db.add(
            AuditLog(
                user_id=reporter.id,
                action="CREATE_ISSUE",
                entity_type="ISSUE",
                entity_id=issue.id,
                details=f"Reported: {issue.title}",
                created_at=created_time,
            )
        )

        # Initial Notification
        db.add(
            Notification(
                user_id=reporter.id,
                issue_id=issue.id,
                title="Issue Submitted",
                message=f"Your issue '{issue.title}' has been submitted.",
                is_read=True if item["status"] == IssueStatus.RESOLVED else False,
                created_at=created_time,
            )
        )

    db.commit()
    return counts


if __name__ == "__main__":
    db = SessionLocal()
    try:
        results = seed_database(db)
        print(f"Seed complete! Added: {results}")
    finally:
        db.close()
