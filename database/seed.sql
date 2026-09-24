-- ==============================================================================
-- Campus360 Database Initial Seed Data
-- ==============================================================================

-- 1. INITIAL CATEGORIES
INSERT INTO categories (id, name, description, is_active, created_at)
VALUES 
    ('cat-001', 'Electrical & Lighting', 'Power outlets, wiring, classroom projectors, fans, lights', TRUE, CURRENT_TIMESTAMP),
    ('cat-002', 'Plumbing & Water Supply', 'Restroom leaks, taps, drinking water purifiers, drainage', TRUE, CURRENT_TIMESTAMP),
    ('cat-003', 'HVAC & Air Conditioning', 'Classroom & laboratory AC units, cooling towers, ventilation', TRUE, CURRENT_TIMESTAMP),
    ('cat-004', 'Civil & Carpentry', 'Doors, locks, broken desks, blackboard repairs, wall seepage', TRUE, CURRENT_TIMESTAMP),
    ('cat-005', 'IT & Campus Network', 'Wi-Fi access points, ethernet ports, computer lab workstations', TRUE, CURRENT_TIMESTAMP),
    ('cat-006', 'Elevators & Escalators', 'Main building lifts, freight elevators, maintenance inspection', TRUE, CURRENT_TIMESTAMP),
    ('cat-007', 'Campus Sanitation', 'Trash receptacles, litter removal, restroom cleaning requests', TRUE, CURRENT_TIMESTAMP),
    ('cat-008', 'Safety & Security', 'Fire extinguishers, emergency exits, perimeter fencing, cameras', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 2. INITIAL LOCATIONS
INSERT INTO locations (id, name, description, is_active, created_at)
VALUES 
    ('loc-001', 'Main Academic Block - Floor 1', 'Administrative offices, reception, Principal office', TRUE, CURRENT_TIMESTAMP),
    ('loc-002', 'Main Academic Block - Floor 2', 'Classrooms 201-220, Faculty lounge, Seminar hall', TRUE, CURRENT_TIMESTAMP),
    ('loc-003', 'Main Academic Block - Floor 3', 'Computer Science labs, Data Center, Server room', TRUE, CURRENT_TIMESTAMP),
    ('loc-004', 'Science & Engineering Wing', 'Physics, Chemistry, and Mechanical engineering workshops', TRUE, CURRENT_TIMESTAMP),
    ('loc-005', 'Central Library', 'Reading halls, digital reference section, stack rooms', TRUE, CURRENT_TIMESTAMP),
    ('loc-006', 'Student Activity Center', 'Cafeteria, indoor sports complex, student club offices', TRUE, CURRENT_TIMESTAMP),
    ('loc-007', 'Hostel Block A (Boys)', 'Residential rooms, common mess hall, recreation room', TRUE, CURRENT_TIMESTAMP),
    ('loc-008', 'Hostel Block B (Girls)', 'Residential rooms, common mess hall, visitor reception', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
