# Complete API Endpoint Catalog — Campus360

All API endpoints are prefixed with `/api/v1`.

## Authentication & Identity

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Service health & database connectivity check |
| `POST` | `/auth/register` | Public | Register student or staff account |
| `POST` | `/auth/login` | Public | Authenticate credentials and receive JWT |
| `GET` | `/auth/me` | Authenticated | Return currently authenticated user profile |

## Master Data: Categories & Locations

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/categories?all=false` | Public | List active categories (or all if admin) |
| `POST` | `/categories` | AO / ADMIN | Create new issue category |
| `PATCH` | `/categories/{id}` | AO / ADMIN | Edit or toggle active status of category |
| `DELETE` | `/categories/{id}` | AO / ADMIN | Soft-deactivate category (prevents orphan FK) |
| `GET` | `/locations?all=false` | Public | List active campus locations |
| `POST` | `/locations` | AO / ADMIN | Create new campus location |
| `PATCH` | `/locations/{id}` | AO / ADMIN | Edit or toggle active status of location |
| `DELETE` | `/locations/{id}` | AO / ADMIN | Soft-deactivate location |

## Issues & Reporting

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/issues/upload` | Authenticated | Upload image evidence (JPG/PNG/WEBP, max 5MB) |
| `GET` | `/issues` | Public / Auth | Search, filter, sort, and paginate issues feed |
| `GET` | `/issues/my` | Authenticated | Get current user's personal reported issues |
| `GET` | `/issues/similar` | Public | Find similar active issues by category & location |
| `POST` | `/issues` | Authenticated | Submit new issue report (default status: OPEN, priority: LOW) |
| `GET` | `/issues/{id}` | Public / Auth | Fetch comprehensive issue detail, timeline, and comments |
| `POST` | `/issues/{id}/images` | Authenticated | Attach additional report or resolution photo |

## Administrative & Workflow Controls

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/issues/{id}/verify` | AO / ADMIN | Verify an OPEN issue |
| `POST` | `/issues/{id}/reject` | AO / ADMIN | Reject an invalid issue with mandatory reason |
| `POST` | `/issues/{id}/priority` | AO / ADMIN | Set priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `POST` | `/issues/{id}/assign` | AO / ADMIN | Assign issue to maintenance technician |
| `POST` | `/issues/{id}/status` | Permitted Roles | Transition issue between allowed statuses |
| `POST` | `/issues/{id}/resolve` | Maintenance / Admin | Resolve issue with resolution note and photo |

## Community & Discussions

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/issues/{id}/support` | Authenticated | Support / upvote an issue (unique per user) |
| `DELETE` | `/issues/{id}/support` | Authenticated | Remove support / upvote |
| `POST` | `/issues/{id}/comments` | Authenticated | Post comment on an issue |
| `PATCH` | `/issues/{id}/comments/{cid}` | Author | Edit author's own comment |
| `DELETE` | `/issues/{id}/comments/{cid}` | Author / Admin | Delete comment (admin moderation logged in audit) |

## Notifications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | List notifications with unread count |
| `PATCH` | `/notifications/{id}/read`| Authenticated | Mark single notification as read |
| `POST` | `/notifications/mark-all-read`| Authenticated | Mark all notifications as read |

## Administration, Analytics & Maintenance

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Leadership | Overview KPI counters and overdue issues list |
| `GET` | `/admin/analytics` | Leadership | Comprehensive empirical charts and SLA metrics |
| `GET` | `/admin/users/maintenance`| AO / ADMIN | List active maintenance staff for assignment |
| `GET` | `/admin/audit-logs` | Leadership | View chronological system audit trail |
| `GET` | `/maintenance/assigned` | Maintenance | Get tasks assigned to current technician |
| `POST` | `/maintenance/{id}/start-work`| Maintenance | Acknowledge and transition issue to `IN_PROGRESS` |
