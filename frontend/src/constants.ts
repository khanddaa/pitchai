// frontend/src/constants.ts

export const DARK   = "#1B1240";
export const PURPLE = "#5C2D91";
export const FONT   = "'Plus Jakarta Sans', sans-serif";

export const LABELS: Record<string, string> = {
  goal_x_duration:    "Зорилтот дүн × Хугацаа",
  log_goal:           "Зорилтот дүн",
  category_enc:       "Ангилал",
  log_goal_per_day:   "Өдөрт шаардлагатай дүн",
  main_category_enc:  "Үндсэн ангилал",
  log_duration:       "Хугацааны урт",
  duration_days:      "Хугацаа (өдөр)",
  launch_year:        "Эхлүүлсэн жил",
  name_word_count:    "Нэр дэх үгийн тоо",
  name_length:        "Нэрийн урт",
};

export const CATEGORIES = [
  { name: "Dance",        rate: 62, color: "#16a34a" },
  { name: "Theater",      rate: 64, color: "#16a34a" },
  { name: "Comics",       rate: 54, color: "#16a34a" },
  { name: "Music",        rate: 48, color: "#2563eb" },
  { name: "Art",          rate: 41, color: "#2563eb" },
  { name: "Photography",  rate: 39, color: "#2563eb" },
  { name: "Film & Video", rate: 37, color: "#d97706" },
  { name: "Games",        rate: 35, color: "#d97706" },
  { name: "Design",       rate: 35, color: "#d97706" },
  { name: "Publishing",   rate: 32, color: "#dc2626" },
  { name: "Food",         rate: 25, color: "#dc2626" },
  { name: "Technology",   rate: 20, color: "#dc2626" },
];
