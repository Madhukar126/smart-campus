# Campus360 Architecture & System Design

Campus360 implements a robust, modular three-tier architecture connecting students, faculty, administrative leaders, and maintenance teams.

```text
  Students / Staff / AO / Principal / Maintenance Teams
                           |
                           v
        Next.js 15 Web Application (Port 3000)
        App Router, Tailwind CSS, Recharts, Responsive UI
                           |
                  REST / JSON over HTTP
                           |
                           v
          FastAPI REST Backend (Port 8000)
     JWT Auth, RBAC, State Machine, Pydantic, SQLAlchemy 2
             /             |                \
            v              v                 v
      PostgreSQL /      Static Local      Audit &
    SQLite Database    Image Storage   Notifications
```

---

## Issue Status Transition Rules

The lifecycle of an issue follows an explicit state machine enforced at the service layer:

```text
                [ OPEN ]
                 /    \
  (AO/ADMIN)    /      \  (AO/ADMIN with reason)
               v        v
         [ VERIFIED ] [ REJECTED ]
              |
  (AO/ADMIN)  | (assigns maintenance user)
              v
         [ ASSIGNED ]
              |
 (MAINT/ADMIN)| (starts work)
              v
        [ IN_PROGRESS ]
              |
 (MAINT/ADMIN)| (resolution note + photo)
              v
         [ RESOLVED ]
```

### Transition Validation Rules:
1. **Students & Staff**: Can submit reports (created as `OPEN`, priority defaults to `LOW`). They cannot verify, set priority, or assign issues.
2. **Verification**: Only `AO` or `ADMIN` can verify an `OPEN` issue.
3. **Rejection**: Requires a non-empty rejection reason. Only `OPEN` or `VERIFIED` issues can be rejected.
4. **Assignment**: Can only assign active `MAINTENANCE` personnel. Moving to `ASSIGNED` requires specifying `assigned_to`.
5. **Work Started (`IN_PROGRESS`)**: Requires the issue to be `ASSIGNED`. Only the assigned maintenance technician or an administrator can begin work.
6. **Resolution (`RESOLVED`)**: Requires the issue to be `IN_PROGRESS` and requires a non-empty `resolution_note`. Resolution photo upload is supported. Completes any active assignment.
7. **Audit & Notifications**: Every transition automatically generates an `IssueUpdate` timeline entry, an `AuditLog` record, and targeted `Notification` items.

---

## Role-Permission Matrix

| Action | STUDENT / STAFF | AO / ADMIN | PRINCIPAL | MAINTENANCE |
|---|:---:|:---:|:---:|:---:|
| Report Issue | ✅ | ✅ | ✅ | ✅ |
| Upload Photos | ✅ | ✅ | ✅ | ✅ |
| View Issues Feed | ✅ | ✅ | ✅ | ✅ |
| Upvote / Support | ✅ | ✅ | ✅ | ✅ |
| Add Comments | ✅ | ✅ | ✅ | ✅ |
| Edit Own Comments | ✅ | ✅ | ✅ | ✅ |
| Moderate Any Comment | ❌ | ✅ | ❌ | ❌ |
| Set Priority | ❌ | ✅ | ❌ | ❌ |
| Verify Issue | ❌ | ✅ | ❌ | ❌ |
| Reject Issue | ❌ | ✅ | ❌ | ❌ |
| Assign Technician | ❌ | ✅ | ❌ | ❌ |
| Start Work (In Progress) | ❌ | ✅ | ❌ | ✅ (assigned only) |
| Resolve Issue | ❌ | ✅ | ❌ | ✅ (assigned only) |
| Manage Categories / Locations | ❌ | ✅ | ❌ | ❌ |
| View Executive Analytics | ❌ | ✅ | ✅ | ❌ |
| View Audit Logs | ❌ | ✅ | ✅ | ❌ |

---

## Overdue Escalation Policy

Issues are considered **Overdue** if they remain unresolved (`status` not in `RESOLVED`, `REJECTED`) after a threshold determined by their priority:

- **CRITICAL**: Overdue after **4 hours**
- **HIGH**: Overdue after **24 hours**
- **MEDIUM**: Overdue after **72 hours (3 days)**
- **LOW**: Overdue after **168 hours (7 days)**

Thresholds are configurable in backend settings (`Settings` in `app/core/config.py`). Overdue issues are highlighted with visual badges and grouped in the Administrative Dashboard.

---

## Image Storage Abstraction

Campus360 abstracts image storage behind `BaseStorageService` (`app/services/storage.py`):

1. **Development Interface**: `LocalStorageService` validates file extension, MIME type, and file size (≤ 5MB), assigns a collision-resistant UUID filename, saves to `backend/uploads/`, and returns `/uploads/<filename>`.
2. **Cloud-Ready**: Swapping to cloud storage (e.g., Cloudinary or S3) only requires implementing the `save_image(file)` interface method without modifying any route or database logic.
