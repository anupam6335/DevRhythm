"use client";

import { useState } from "react";
import { company } from "./data";
import styles from "./page.module.css";

function useCompanyData() {
  // 1. Nested destructuring
  const {
    name: companyName,
    departments: {
      engineering: {
        manager: {
          name: engManagerName,
          contact: { email: engManagerEmail },
        },
      },
    },
  } = company;

  // 2. Safe property access
  const hrManagerName = company.departments?.hr?.manager?.name ?? "Vacant";
  const financeManager = company.departments?.finance?.manager?.name ?? "Not found";

  // 3. Functional array methods
  const allEmployees = Object.values(company.departments).flatMap(dept => dept.employees);
  const developerNames = allEmployees
    .filter(emp => emp.role === "Developer")
    .map(emp => emp.name);
  const totalSalary = allEmployees.reduce((sum, emp) => sum + emp.salary, 0);
  const firstQA = allEmployees.find(emp => emp.role === "QA");
  const allWellPaid = allEmployees.every(emp => emp.salary > 60000);
  const hasRecruiter = allEmployees.some(emp => emp.role === "Recruiter");
  const highestPaid = [...allEmployees].sort((a, b) => b.salary - a.salary)[0];
  const employeesByDept = Object.entries(company.departments).reduce(
    (acc, [deptName, dept]) => ({
      ...acc,
      [deptName]: dept.employees.map(e => e.name),
    }),
    {} as Record<string, string[]>
  );

  // 4. Complex object operations – new simple examples built directly in the UI
  return {
    companyName,
    engManagerName,
    engManagerEmail,
    hrManagerName,
    financeManager,
    developerNames,
    totalSalary,
    firstQA,
    allWellPaid,
    hasRecruiter,
    highestPaid,
    employeesByDept,
  };
}

export default function Home() {
  const data = useCompanyData();

  // ---- Simple clone demo with a user object ----
  const originalUser = { name: "Alice", age: 30 };
  const [userCopy, setUserCopy] = useState<typeof originalUser | null>(null);

  const createUserCopy = () => {
    // deep clone (though this object is flat, structuredClone works everywhere)
    setUserCopy(structuredClone(originalUser));
  };

  const makeCopyOlder = () => {
    if (!userCopy) return;
    // immutable update – create a new object based on the copy
    setUserCopy({ ...userCopy, age: userCopy.age + 5 });
  };

  // ---- Immutable nested example (manager rename) ----
  const updatedCompany = {
    ...company,
    departments: {
      ...company.departments,
      engineering: {
        ...company.departments.engineering,
        manager: {
          ...company.departments.engineering.manager,
          name: "Alexandra Rivera",
        },
      },
    },
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>JavaScript Fundamentals - Examples</h1>
      <div className={styles.grid}>
        {/* ---------- 1. Nested Destructuring ---------- */}
        <section className={styles.card}>
          <h2>1. Nested Destructuring</h2>
          <p className={styles.desc}>
            Instead of repeating long paths like{" "}
            <code>company.departments.engineering.manager.name</code>, unpack everything in one go.
          </p>
          <pre className={styles.pre}>{`const {
  name: companyName,
  departments: {
    engineering: {
      manager: {
        name: engManagerName,
        contact: { email: engManagerEmail }
      }
    }
  }
} = company;`}</pre>
          <ul className={styles.list}>
            <li>Company: <strong>{data.companyName}</strong></li>
            <li>Manager: <strong>{data.engManagerName}</strong> ({data.engManagerEmail})</li>
          </ul>
        </section>

        {/* ---------- 2. Safe Property Access ---------- */}
        <section className={styles.card}>
          <h2>2. Safe Property Access</h2>
          <p className={styles.desc}>
            Use <code>?.</code> and <code>??</code> so your code never breaks when data is missing.
          </p>
          <pre className={styles.pre}>{`// Unsafe (crashes if hr is missing):
// company.departments.hr.manager.name

// Safe with fallback:
company.departments?.hr?.manager?.name ?? "Vacant"
company.departments?.finance?.manager?.name ?? "Not found"`}</pre>
          <ul className={styles.list}>
            <li>HR Manager: <strong>{data.hrManagerName}</strong></li>
            <li>Finance Manager: <strong>{data.financeManager}</strong></li>
          </ul>
        </section>

        {/* ---------- 3. Functional Array Methods ---------- */}
        <section className={styles.card}>
          <h2>3. Functional Array Methods</h2>
          <p className={styles.desc}>
            Replace long <code>for</code> loops with short, readable methods that can be chained together.
          </p>

          <div className={styles.example}>
            <strong>Old way (loops):</strong>
            <pre className={styles.pre}>{`const devs = [];
for (let i = 0; i < all.length; i++) {
  if (all[i].role === 'Developer') {
    devs.push(all[i].name);
  }
}`}</pre>
          </div>
          <div className={styles.example}>
            <strong>New way (functional):</strong>
            <pre className={styles.pre}>{`const devs = all
  .filter(e => e.role === 'Developer')
  .map(e => e.name);`}</pre>
          </div>

          <ul className={styles.list}>
            <li>Developers: {data.developerNames.join(", ")}</li>
            <li>Total Salary: ${data.totalSalary.toLocaleString("en-US")}</li>
            <li>First QA: {data.firstQA?.name ?? "None"} (${data.firstQA?.salary})</li>
            <li>Highest Paid: {data.highestPaid.name} (${data.highestPaid.salary})</li>
            <li>Everyone earns &gt; 60k: {data.allWellPaid ? "Yes" : "No"}</li>
            <li>Has Recruiter: {data.hasRecruiter ? "Yes" : "No"}</li>
            <li>By department: {JSON.stringify(data.employeesByDept)}</li>
          </ul>
        </section>

        {/* ---------- 4. Complex Object Operations (simplified) ---------- */}
        <section className={styles.card}>
          <h2>4. Complex Object Operations</h2>
          <p className={styles.desc}>
            How to copy and update objects without changing the original – like using a photocopy.
          </p>

          {/* --- Simple user copy demo --- */}
          <div className={styles.cloneDemo}>
            <h3>Copy a simple object</h3>
            <p>
              Original user: <strong>{originalUser.name}</strong>, age{" "}
              <strong>{originalUser.age}</strong>
            </p>

            {!userCopy ? (
              <button className={styles.btn} onClick={createUserCopy}>
                Create a copy
              </button>
            ) : (
              <>
                <p>
                  Copy: <strong>{userCopy.name}</strong>, age{" "}
                  <strong>{userCopy.age}</strong>
                </p>
                <button className={styles.btn} onClick={makeCopyOlder}>
                  Make copy 5 years older
                </button>
                <p className={styles.muted}>
                  After the change, the original is still <strong>{originalUser.name}</strong>, age{" "}
                  <strong>{originalUser.age}</strong> – untouched.
                </p>
              </>
            )}
          </div>

          {/* --- Nested immutable update example --- */}
          <div className={styles.cloneDemo}>
            <h3>Nested object – changing a manager’s name</h3>
            <p>
              Original manager: <strong>Alex Rivera</strong>
              <br />
              Copy (updated): <strong>Alexandra Rivera</strong>
            </p>
            <p className={styles.muted}>
              The original company object still says “Alex Rivera”. The change only lives in the copy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}