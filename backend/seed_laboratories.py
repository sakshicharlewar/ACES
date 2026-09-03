import asyncio
import sys
from sqlalchemy import select
from database import AsyncSessionLocal, init_db
from models import Laboratory

labs = [
  {
    "title": "Object Oriented Programming (OOP) Lab",
    "image": "/Lab1.jpeg",
    "location": "1st Floor, F-33-A",
    "in_charge": "Prof. Mrunali Gajbhiye",
    "equipment": {
      "left": [
        "Dell Vostro Desktop 3268 (20)",
        "Intel Core i5 Processor",
        "Windows 11",
        "Java JDK 21"
      ],
      "right": [
        "Eclipse IDE",
        "IntelliJ IDEA",
        "NetBeans IDE",
        "LAN & Internet Connectivity"
      ]
    },
    "display_order": 1
  },
  {
    "title": "Operating Systems Lab",
    "image": "/Lab2.jpeg",
    "location": "1st Floor, F-33-B",
    "in_charge": "Prof. Utkarsha Gode",
    "equipment": {
      "left": [
        "Dell Vostro Desktop 3268 (21)",
        "Intel Core i5 Processor",
        "Ubuntu Linux",
        "Windows Dual Boot"
      ],
      "right": [
        "VMware Workstation",
        "VirtualBox",
        "GCC Compiler",
        "LAN & Internet Connectivity"
      ]
    },
    "display_order": 2
  },
  {
    "title": "Python Programming & AI Lab",
    "image": "/Lab3.jpeg",
    "location": "1st Floor, F-33-C",
    "in_charge": "Prof. Jayshree Gorakh",
    "equipment": {
      "left": [
        "Dell Vostro Desktop 3268 (20)",
        "Windows 11",
        "Python 3.x",
        "Jupyter Notebook",
        "VS Code"
      ],
      "right": [
        "Anaconda",
        "NumPy & Pandas",
        "TensorFlow",
        "High-Speed Internet"
      ]
    },
    "display_order": 3
  },
  {
    "title": "Web Development & Database Lab",
    "image": "/Lab4.jpeg",
    "location": "1st Floor, F-33-D",
    "in_charge": "Prof. (Faculty Name)",
    "equipment": {
      "left": [
        "Dell Vostro Desktop 3268 (20)",
        "Windows 11",
        "VS Code",
        "Node.js"
      ],
      "right": [
        "React.js",
        "MongoDB",
        "MySQL Server",
        "Git & GitHub",
        "LAN & Internet Connectivity"
      ]
    },
    "display_order": 4
  }
]

async def seed():
    await init_db()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Laboratory))
        existing = result.scalars().all()
        
        if existing:
            print("Laboratories already seeded!")
            return
            
        for lab_data in labs:
            lab = Laboratory(**lab_data)
            session.add(lab)
            
        await session.commit()
        print("Laboratories seeded successfully!")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed())
