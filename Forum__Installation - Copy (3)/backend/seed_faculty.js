import { facultyData } from "../src/data/facultyData.js";

async function seed() {
  for (let i = 0; i < facultyData.length; i++) {
    const f = facultyData[i];
    
    const payload = {
      slug: f.id,
      name: f.name,
      designation: f.designation,
      department: f.department,
      qualification: f.qualification,
      experience: f.experience,
      image: f.image,
      email: f.email,
      linkedin: f.linkedin || "",
      professional_summary: f.professionalSummary,
      specialization: f.specialization,
      research_interests: f.researchInterests || [],
      subjects_taught: f.subjectsTaught || [],
      academic_qualifications: f.academicQualifications || [],
      publications: f.publications || [],
      achievement_images: f.achievementImages || [],
      professional_info: f.professionalInfo || {},
      gallery: f.gallery || [],
      display_order: i + 1
    };

    try {
      const res = await fetch("http://localhost:8000/admin/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        console.log(`Added ${f.name}`);
      } else {
        const err = await res.json();
        console.log(`Failed to add ${f.name}:`, err.detail);
      }
    } catch (e) {
      console.error(`Error adding ${f.name}:`, e.message);
    }
  }
}

seed();
