import fs from "fs";
import path from "path";

export function getCreatorCount(): number {
  const baseCount = 84;
  const maxCount = 99; // Cap at 99 to keep urgency before manual review
  try {
    const filePath = path.join(process.cwd(), "applications.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const currentApps = JSON.parse(fileContent || "[]");
      
      // Only count unique name or email submissions
      const uniqueSubmissions = new Set(
        currentApps.map((app: any) => app.email !== "N/A" ? app.email : app.handle)
      );
      
      return Math.min(baseCount + uniqueSubmissions.size, maxCount);
    }
  } catch (err) {
    console.error("Error reading applications count:", err);
  }
  return baseCount;
}
