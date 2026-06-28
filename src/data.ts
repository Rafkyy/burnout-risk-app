import { User, AssessmentResult, AssessmentInput, RecommendationItem, RiskLevel } from './types';

export const DEFAULT_USER: User = {
  name: 'Aditia',
  email: 'aditia.pratama@email.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
};

export const RECOM_TEMPLATES: Omit<RecommendationItem, 'completed'>[] = [
  {
    id: 'rec_1',
    title: 'Kurangi beban kerja',
    desc: 'Prioritaskan tugas utama dan delegasikan jika memungkinkan.',
    category: 'Tinggi',
  },
  {
    id: 'rec_2',
    title: 'Atur jadwal istirahat',
    desc: 'Ambil jeda singkat setiap beberapa jam kerja.',
    category: 'Sedang',
  },
  {
    id: 'rec_3',
    title: 'Diskusi dengan HR/Manager',
    desc: 'Bicarakan tantangan dan cari solusi bersama.',
    category: 'Tinggi',
  },
  {
    id: 'rec_4',
    title: 'Evaluasi WFH setup',
    desc: 'Pastikan ruang kerja nyaman dan bebas gangguan.',
    category: 'Rendah',
  },
  {
    id: 'rec_5',
    title: 'Lakukan hobi di luar kerja',
    desc: 'Luangkan waktu untuk kegiatan yang menyenangkan.',
    category: 'Sedang',
  },
];

export const DEFAULT_HISTORY: AssessmentResult[] = [
  {
    id: 'hist_1',
    date: '15 Feb 2024',
    score: 0.18,
    riskLevel: 'Rendah',
    input: {
      jenisKelamin: 'Laki-laki',
      tipePerusahaan: 'Teknologi',
      wfhSetup: true,
      levelJabatan: 1,
      alokasiSumberDaya: 4,
      skorKelebihanMental: 1,
    },
    shapFactors: [
      { factor: 'Skor Kelebihan Mental', percentage: 12 },
      { factor: 'Alokasi Sumber Daya', percentage: 38 },
      { factor: 'WFH Setup', percentage: 40 },
    ],
    recommendations: RECOM_TEMPLATES.map((r, idx) => ({ ...r, completed: idx < 1 })),
  },
  {
    id: 'hist_2',
    date: '10 Mar 2024',
    score: 0.82,
    riskLevel: 'Tinggi',
    input: {
      jenisKelamin: 'Laki-laki',
      tipePerusahaan: 'Teknologi',
      wfhSetup: false,
      levelJabatan: 3,
      alokasiSumberDaya: 1,
      skorKelebihanMental: 4,
    },
    shapFactors: [
      { factor: 'Skor Kelebihan Mental', percentage: 45 },
      { factor: 'Alokasi Sumber Daya', percentage: 30 },
      { factor: 'WFH Setup', percentage: 15 },
    ],
    recommendations: RECOM_TEMPLATES.map((r) => ({ ...r, completed: false })),
  },
  {
    id: 'hist_3',
    date: '18 Apr 2024',
    score: 0.48,
    riskLevel: 'Sedang',
    input: {
      jenisKelamin: 'Laki-laki',
      tipePerusahaan: 'Keuangan',
      wfhSetup: true,
      levelJabatan: 2,
      alokasiSumberDaya: 2,
      skorKelebihanMental: 3,
    },
    shapFactors: [
      { factor: 'Skor Kelebihan Mental', percentage: 35 },
      { factor: 'Alokasi Sumber Daya', percentage: 25 },
      { factor: 'WFH Setup', percentage: 18 },
    ],
    recommendations: RECOM_TEMPLATES.map((r, idx) => ({ ...r, completed: idx % 2 === 0 })),
  },
  {
    id: 'hist_4',
    date: '25 Mei 2024',
    score: 0.25,
    riskLevel: 'Rendah',
    input: {
      jenisKelamin: 'Perempuan',
      tipePerusahaan: 'Kesehatan',
      wfhSetup: true,
      levelJabatan: 1,
      alokasiSumberDaya: 3,
      skorKelebihanMental: 2,
    },
    shapFactors: [
      { factor: 'Skor Kelebihan Mental', percentage: 20 },
      { factor: 'Alokasi Sumber Daya', percentage: 40 },
      { factor: 'WFH Setup', percentage: 30 },
    ],
    recommendations: RECOM_TEMPLATES.map((r, idx) => ({ ...r, completed: idx < 2 })),
  },
];

export function calculateAssessmentResult(input: AssessmentInput, id = `hist_${Date.now()}`): AssessmentResult {
  // Let's compute a realistic logic rating
  // base score: 0.25
  let scoreAdjust = 0.25;

  // Mental Overload (1-4): High weight
  scoreAdjust += (input.skorKelebihanMental * 0.15); // max +0.60

  // Resource Allocation (1-4): Positive buffer (reduces score)
  scoreAdjust -= (input.alokasiSumberDaya * 0.08); // max -0.32

  // Job Level (1-3): Medium positive impact
  scoreAdjust += (input.levelJabatan * 0.07); // max +0.21

  // WFH integration (bool): Negative buffer (reduces score)
  if (input.wfhSetup) {
    scoreAdjust -= 0.12;
  } else {
    scoreAdjust += 0.08;
  }

  // Slight noise to make it feel organic
  const randomFraction = Math.random() * 0.04 - 0.02;
  let finalScore = scoreAdjust + randomFraction;

  // Clamp scoring
  finalScore = Math.max(0.05, Math.min(finalScore, 0.98));
  // Round to 2 decimal places
  finalScore = Math.round(finalScore * 100) / 100;

  // Set risk category
  let riskLevel: RiskLevel = 'Rendah';
  if (finalScore >= 0.65) {
    riskLevel = 'Tinggi';
  } else if (finalScore >= 0.35) {
    riskLevel = 'Sedang';
  }

  // Calculate dynamic SHAP contributions
  // We want to explain which inputs drove the score the most absolute value
  const mentalContribution = input.skorKelebihanMental * 35;
  const resourceContribution = (5 - input.alokasiSumberDaya) * 20; // smaller resources = higher contribution to burnout
  const wfhContribution = input.wfhSetup ? 10 : 30; // no WFH contributes highly to burnout

  const totalContrib = mentalContribution + resourceContribution + wfhContribution;
  
  // Normalize SHAP to look clean
  const shapFactors = [
    {
      factor: 'Skor Kelebihan Mental',
      percentage: Math.round((mentalContribution / totalContrib) * 78), // scaled to matching percentages around 35-45% max
    },
    {
      factor: 'Alokasi Sumber Daya',
      percentage: Math.round((resourceContribution / totalContrib) * 55),
    },
    {
      factor: 'WFH Setup',
      percentage: Math.round((wfhContribution / totalContrib) * 35),
    },
  ];

  // Ensure factors are at least realistic numbers
  shapFactors.forEach(f => {
    if (f.percentage < 5) f.percentage = 8;
  });

  // Create Recommendation instances copy
  const recommendations: RecommendationItem[] = RECOM_TEMPLATES.map((item) => {
    // Determine completed based on logic or set default to uncompleted for fresh inputs
    return {
      ...item,
      completed: false,
    };
  });

  // format date nicely
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  return {
    id,
    date: formattedDate,
    score: finalScore,
    riskLevel,
    input,
    shapFactors,
    recommendations,
  };
}
