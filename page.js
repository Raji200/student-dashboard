"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetch("/students_with_personas.json")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error("Failed to load JSON:", err));
  }, []);

  if (!students.length) return <p>Loading data...</p>;

  // 1️⃣ Insights calculations
  const topStudent = students.reduce((max, s) => s.assessment_score > max.assessment_score ? s : max, students[0]);

  const avgByClass = {};
  ["A","B","C"].forEach(cls => {
    const clsStudents = students.filter(s => s.class === cls);
    avgByClass[cls] = clsStudents.length > 0
      ? (clsStudents.reduce((sum,s)=>sum+s.assessment_score,0)/clsStudents.length).toFixed(2)
      : 0;
  });

  const numericKeys = ["comprehension","attention","focus","retention","engagement_time"];
  const correlations = {};
  numericKeys.forEach(key => {
    const x = students.map(s => s[key]);
    const y = students.map(s => s.assessment_score);
    const n = x.length;
    const sumX = x.reduce((a,b)=>a+b,0);
    const sumY = y.reduce((a,b)=>a+b,0);
    const sumXY = x.reduce((a,b,i)=>a+b*y[i],0);
    const sumX2 = x.reduce((a,b)=>a+b*b,0);
    const sumY2 = y.reduce((a,b)=>a+b*b,0);
    const r = (n*sumXY - sumX*sumY)/Math.sqrt((n*sumX2 - sumX*sumX)*(n*sumY2 - sumY*sumY));
    correlations[key] = r;
  });
  const topSkill = Object.entries(correlations).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0][0];

  // 2️⃣ Table filtering and sorting
  let filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (sortColumn) {
    filteredStudents.sort((a,b) => sortOrder==="asc" ? a[sortColumn]-b[sortColumn] : b[sortColumn]-a[sortColumn]);
  }

  return (
    <div style={{ padding: "20px", fontFamily:"Arial" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>Student Dashboard</h1>

      {/* Insights Section */}
      <h2>Insights</h2>
      <ul>
        <li>Top Student: {topStudent.name} ({topStudent.assessment_score})</li>
        <li>Class A Avg Score: {avgByClass.A}</li>
        <li>Class B Avg Score: {avgByClass.B}</li>
        <li>Class C Avg Score: {avgByClass.C}</li>
        <li>Skill most correlated with performance: {topSkill}</li>
      </ul>

      {/* Bar Chart: Skill vs Assessment Score */}
      <h2>Average Skill vs Assessment Score</h2>
      <BarChart width={600} height={300} data={numericKeys.map(k=>{
        return { skill:k, avg: (students.reduce((sum,s)=>sum+s[k],0)/students.length).toFixed(2) }
      })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="skill" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="avg" fill="#8884d8" />
      </BarChart>

      {/* Scatter Chart: Attention vs Assessment */}
      <h2>Attention vs Assessment Score</h2>
      <ScatterChart width={600} height={300}>
        <CartesianGrid />
        <XAxis type="number" dataKey="attention" name="Attention" />
        <YAxis type="number" dataKey="assessment_score" name="Score" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Students" data={students} fill="#82ca9d" />
      </ScatterChart>

      {/* Radar Chart: Top Student Profile */}
      <h2>Top Student Profile (Radar)</h2>
      <RadarChart cx={300} cy={200} outerRadius={100} width={600} height={400}
        data={numericKeys.map(k=>({ skill:k, value: topStudent[k] }))}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <PolarRadiusAxis />
        <Radar name={topStudent.name} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>

      {/* Searchable & Sortable Table */}
      <h2>Student Table</h2>
      <input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding:"5px" }}
      />
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th onClick={()=>{setSortColumn("student_id"); setSortOrder(sortOrder==="asc"?"desc":"asc")}}>ID</th>
            <th>Name</th>
            <th onClick={()=>{setSortColumn("assessment_score"); setSortOrder(sortOrder==="asc"?"desc":"asc")}}>Score</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td>{s.name}</td>
              <td>{s.assessment_score}</td>
              <td>{s.class}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
