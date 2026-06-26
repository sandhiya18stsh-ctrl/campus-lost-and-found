from app.core.security import get_password_hash
from app.models.category import Category
from app.models.location import Location
from app.models.user import User


DEFAULT_CATEGORIES = [
    ("Electronics", "Phones, laptops, headphones, chargers, and other devices"),
    ("Books", "Textbooks, notebooks, library books, and study material"),
    ("Bags", "Backpacks, handbags, laptop bags, and pouches"),
    ("Clothing", "Jackets, hoodies, caps, scarves, and uniforms"),
    ("IDs & Cards", "Student IDs, access cards, wallets, and bank cards"),
    ("Keys", "Room keys, vehicle keys, and keychains"),
    ("Sports", "Sports gear, bottles, gym bags, and equipment"),
    ("Other", "Items that do not fit another category"),
]

DEFAULT_LOCATIONS = [
    ("Main Library", "Library", "1-4", "Study rooms, reading halls, and circulation desk"),
    ("Student Center", "Student Center", "Ground", "Cafeteria, lounge, and help desk"),
    ("Engineering Block", "Engineering", "1-5", "Labs, classrooms, and project spaces"),
    ("Science Building", "Science", "1-3", "Lecture halls and laboratories"),
    ("Sports Complex", "Athletics", "Ground", "Courts, gym, lockers, and fields"),
    ("Administration Office", "Admin", "Ground", "Reception and student services"),
    ("Auditorium", "Arts", "Ground", "Events hall and backstage areas"),
    ("Parking Area", "Campus", "Outdoor", "Vehicle and bicycle parking zones"),
]

DEFAULT_USERS = [
    ("admin@campus.edu", "Admin", "User", "ADMIN", None, "Administration"),
    ("student1@campus.edu", "Student", "One", "STUDENT", "S1001", "Computer Science"),
    ("staff1@campus.edu", "Staff", "One", "STAFF", None, "Student Services"),
]


def seed_defaults(db):
    if db.query(Category).count() == 0:
        db.add_all([
            Category(name=name, description=description, is_active=True)
            for name, description in DEFAULT_CATEGORIES
        ])

    if db.query(Location).count() == 0:
        db.add_all([
            Location(
                name=name,
                building=building,
                floor=floor,
                description=description,
                is_active=True,
            )
            for name, building, floor, description in DEFAULT_LOCATIONS
        ])

    if db.query(User).count() == 0:
        db.add_all([
            User(
                email=email,
                password_hash=get_password_hash("password123"),
                first_name=first_name,
                last_name=last_name,
                role=role,
                student_id=student_id,
                department=department,
                is_active=True,
            )
            for email, first_name, last_name, role, student_id, department in DEFAULT_USERS
        ])

    db.commit()
