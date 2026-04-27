// Nested company object with departments, null fields, and arrays
export const company = {
  name: "TechVibe",
  founded: 2019,
  departments: {
    engineering: {
      manager: {
        name: "Alex Rivera",
        age: 34,
        contact: {
          email: "alex@techvibe.io",
          phone: "555-0101"
        }
      },
      employees: [
        { id: 1, name: "Sam", role: "Developer", salary: 85000, skills: ["JS", "React"] },
        { id: 2, name: "Jordan", role: "Developer", salary: 92000, skills: ["Python", "Django"] },
        { id: 3, name: "Casey", role: "QA", salary: 70000, skills: ["Selenium", "Jest"] }
      ]
    },
    hr: {
      manager: null,                // explicitly absent
      employees: [
        { id: 4, name: "Riley", role: "Recruiter", salary: 65000, skills: ["Interviewing"] }
      ]
    }
  }
};