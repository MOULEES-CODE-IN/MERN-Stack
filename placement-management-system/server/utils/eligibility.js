// Decides whether a student can apply to a drive. Returns every reason that blocks them.
exports.checkEligibility = (user, drive) => {
  const reasons = [];
  const s = user.student || {};
  if (!s.resume || !s.resume.url) reasons.push("Upload your resume before applying");
  if (drive.minCgpa && (s.cgpa === undefined || s.cgpa === null || s.cgpa < drive.minCgpa)) {
    reasons.push(`Minimum CGPA of ${drive.minCgpa} required`);
  }
  if (drive.departments && drive.departments.length && !drive.departments.includes(s.department)) {
    reasons.push(`Open to ${drive.departments.join(", ")} only`);
  }
  if (new Date(drive.deadline) < new Date()) reasons.push("The application deadline has passed");
  return { eligible: reasons.length === 0, reasons };
};
