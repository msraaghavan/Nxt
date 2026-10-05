// Engineering colleges in Telangana & Andhra Pradesh: NxtWave's home market and
// the plan's launch geography. Used for the college picker and College Wars.
export interface College {
  name: string
  short: string
  city: string
}

export const COLLEGES: College[] = [
  { name: 'CVR College of Engineering', short: 'CVR', city: 'Hyderabad' },
  { name: 'VNR Vignana Jyothi Institute of Engineering & Technology', short: 'VNRVJIET', city: 'Hyderabad' },
  { name: 'Chaitanya Bharathi Institute of Technology', short: 'CBIT', city: 'Hyderabad' },
  { name: 'Gokaraju Rangaraju Institute of Engineering & Technology', short: 'GRIET', city: 'Hyderabad' },
  { name: 'Vasavi College of Engineering', short: 'Vasavi', city: 'Hyderabad' },
  { name: 'Keshav Memorial Institute of Technology', short: 'KMIT', city: 'Hyderabad' },
  { name: 'MLR Institute of Technology', short: 'MLRIT', city: 'Hyderabad' },
  { name: 'Malla Reddy College of Engineering & Technology', short: 'MRCET', city: 'Hyderabad' },
  { name: 'CMR College of Engineering & Technology', short: 'CMRCET', city: 'Hyderabad' },
  { name: 'Vardhaman College of Engineering', short: 'Vardhaman', city: 'Hyderabad' },
  { name: 'Sreenidhi Institute of Science & Technology', short: 'SNIST', city: 'Hyderabad' },
  { name: 'Institute of Aeronautical Engineering', short: 'IARE', city: 'Hyderabad' },
  { name: 'Anurag University', short: 'Anurag', city: 'Hyderabad' },
  { name: 'Geethanjali College of Engineering & Technology', short: 'GCET', city: 'Hyderabad' },
  { name: 'BVRIT Hyderabad College of Engineering for Women', short: 'BVRITH', city: 'Hyderabad' },
  { name: 'Methodist College of Engineering & Technology', short: 'Methodist', city: 'Hyderabad' },
  { name: 'Matrusri Engineering College', short: 'Matrusri', city: 'Hyderabad' },
  { name: 'Vidya Jyothi Institute of Technology', short: 'VJIT', city: 'Hyderabad' },
  { name: 'JNTUH University College of Engineering', short: 'JNTUH CEH', city: 'Hyderabad' },
  { name: 'Kakatiya Institute of Technology & Science', short: 'KITSW', city: 'Warangal' },
  { name: 'KL University', short: 'KLU', city: 'Vijayawada' },
  { name: 'Velagapudi Ramakrishna Siddhartha Engineering College', short: 'VRSEC', city: 'Vijayawada' },
  { name: 'RVR & JC College of Engineering', short: 'RVRJC', city: 'Guntur' },
  { name: "Vignan's Foundation for Science, Technology & Research", short: 'Vignan', city: 'Guntur' },
  { name: 'Gudlavalleru Engineering College', short: 'GEC', city: 'Gudlavalleru' },
  { name: 'Gayatri Vidya Parishad College of Engineering', short: 'GVPCE', city: 'Visakhapatnam' },
  { name: 'Anil Neerukonda Institute of Technology & Sciences', short: 'ANITS', city: 'Visakhapatnam' },
  { name: 'SRKR Engineering College', short: 'SRKR', city: 'Bhimavaram' },
  { name: 'Aditya Engineering College', short: 'Aditya', city: 'Surampalem' },
  { name: 'Sree Vidyanikethan Engineering College', short: 'SVEC', city: 'Tirupati' },
  { name: 'JNTUK University College of Engineering', short: 'JNTUK UCEK', city: 'Kakinada' },
  { name: 'Sri Vasavi Engineering College', short: 'SVEC-TPG', city: 'Tadepalligudem' },
]

export const BRANCHES = ['CSE', 'IT', 'CSE (AI & ML) / Data Science', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other']

export function shortName(college: string) {
  return COLLEGES.find((c) => c.name === college)?.short ?? college.split(/[\s,]+/).slice(0, 2).join(' ')
}

/** Map "cbit", "CBIT Hyderabad" or the full name to the canonical college name. */
export function normalizeCollege(input: string) {
  const q = input.trim().toLowerCase().replace(/[^a-z0-9& ]/g, '')
  if (!q) return input.trim()
  const hit =
    COLLEGES.find((c) => c.name.toLowerCase().replace(/[^a-z0-9& ]/g, '') === q) ??
    COLLEGES.find((c) => c.short.toLowerCase() === q) ??
    COLLEGES.find((c) => q.split(' ')[0] === c.short.toLowerCase()) ??
    (q.length >= 2 ? COLLEGES.find((c) => c.short.toLowerCase().startsWith(q) || c.name.toLowerCase().startsWith(q + ' ')) : undefined)
  return hit ? hit.name : input.trim()
}
