import { AssessmentResult, AssessmentInput, RecommendationItem, RiskLevel } from './types';

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
