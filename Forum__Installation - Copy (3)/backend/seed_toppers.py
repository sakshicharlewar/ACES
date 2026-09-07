import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import AcademicTopper

TOPPERS_DATA = [
    # Final Year
    {
        "year_group": "final_year",
        "rank": 1,
        "name": "Tushar Nimje",
        "branch": "Computer Engineering",
        "cgpa": "9.85",
        "achievement": "All Rounder Award",
        "image": "/toppers/tushar.jpeg",
        "display_order": 1
    },
    {
        "year_group": "final_year",
        "rank": 2,
        "name": "Harshit Bhandarkar",
        "branch": "Computer Engineering",
        "cgpa": "9.72",
        "achievement": "Best Project Award",
        "image": "/toppers/harshit.jpeg",
        "display_order": 2
    },
    {
        "year_group": "final_year",
        "rank": 3,
        "name": "Hitanshu Deshmukh",
        "branch": "Computer Engineering",
        "cgpa": "9.68",
        "achievement": "Excellence in Academics",
        "image": "/toppers/hitanshu.jpeg",
        "display_order": 3
    },
    # Third Year
    {
        "year_group": "third_year",
        "rank": 1,
        "name": "Rajiv Ramteke",
        "branch": "Computer Engineering",
        "cgpa": "8.74",
        "achievement": "",
        "image": "/toppers/rajiv.jpeg",
        "display_order": 1
    },
    {
        "year_group": "third_year",
        "rank": 2,
        "name": "Mayuri Lanjewar",
        "branch": "Computer Engineering",
        "cgpa": "8.64",
        "achievement": "",
        "image": "/toppers/mayuri.jpeg",
        "display_order": 2
    },
    {
        "year_group": "third_year",
        "rank": 3,
        "name": "Parag Yeole",
        "branch": "Computer Engineering",
        "cgpa": "8.53",
        "achievement": "",
        "image": "/toppers/parag.jpeg",
        "display_order": 3
    },
    # Second Year
    {
        "year_group": "second_year",
        "rank": 1,
        "name": "Aishwarya Dhole",
        "branch": "Computer Engineering",
        "cgpa": "9.12",
        "score_label": "CGPA",
        "achievement": "",
        "image": "/toppers/aishwarya.jpeg",
        "display_order": 1
    },
    {
        "year_group": "second_year",
        "rank": 2,
        "name": "Vaishnavi Yelne",
        "branch": "Computer Engineering",
        "cgpa": "8.77",
        "score_label": "CGPA",
        "achievement": "",
        "image": "/toppers/vaishnavi.jpeg",
        "display_order": 2
    },
    {
        "year_group": "second_year",
        "rank": 3,
        "name": "Sakshi Charlewar",
        "branch": "Computer Engineering",
        "cgpa": "8.75",
        "score_label": "CGPA",
        "achievement": "",
        "image": "/toppers/sakshi.png",
        "display_order": 3
    }
]

async def seed():
    async with AsyncSessionLocal() as db:
        for data in TOPPERS_DATA:
            existing = await db.execute(
                select(AcademicTopper).where(
                    (AcademicTopper.year_group == data["year_group"]) & 
                    (AcademicTopper.name == data["name"])
                )
            )
            if existing.scalar_one_or_none():
                print(f"Skipping {data['name']} (already exists)")
                continue
            topper = AcademicTopper(**data)
            db.add(topper)
            print(f"Added {data['name']} ({data['year_group']} - Rank {data['rank']})")
        
        await db.commit()
        print("Academic Toppers data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
