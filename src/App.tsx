import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Video, Square } from 'lucide-react';

const TEACHER_EMAIL = "omarzoog@mercy.edu";
const CC_EMAIL = "othmanabdullahmarzoog@gmail.com";

interface Question {
  id: number;
  question_ar_full?: string;
  question_ar_blank?: string;
  question_ar?: string;
  question_en: string;
  correct: string;
  image?: string;
  mark: number;
  choices?: string[];
}

interface Response {
  id: number;
  studentAnswer: string;
  correctAnswer: string;
  mark: number;
  earned: number;
  isAnswered: boolean;
}

interface LeaderboardEntry {
  name: string;
  email: string;
  score: number;
  total: number;
  date: string;
}

const baseQuestions: Question[] = [
  { "id": 3, "question_ar_full": "متى وضعتَ القلم في الحقيبة؟", "question_ar_blank": "____ وضعتَ القلم في الحقيبة؟", "question_en": "When did you put the pen in the bag?", "correct": "متى", "image": "https://loremflickr.com/900/520/school,bag,student?lock=46169", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 6, "question_ar_full": "متى يَبْدَأُ الدَّرْسُ؟", "question_ar_blank": "____ يَبْدَأُ الدَّرْسُ؟", "question_en": "When does the lesson start?", "correct": "متى", "image": "https://loremflickr.com/900/520/school,classroom,clock?lock=89863", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 10, "question_ar_full": "متى ذَهَبْتَ إلى البَيْت؟", "question_ar_blank": "____ ذَهَبْتَ إلى البَيْت؟", "question_en": "When did you go home?", "correct": "متى", "image": "https://loremflickr.com/900/520/house,evening,street?lock=81847", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 18, "question_ar_full": "متى يَنْتَهِي العَمَل؟", "question_ar_blank": "____ يَنْتَهِي العَمَل؟", "question_en": "When does the work end?", "correct": "متى", "image": "https://loremflickr.com/900/520/office,clock,work?lock=90282", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 16, "question_ar_full": "أيُّ فَاكِهَةٍ تُحِب؟", "question_ar_blank": "____ فَاكِهَةٍ تُحِب؟", "question_en": "Which fruit do you like?", "correct": "أي", "image": "https://loremflickr.com/900/520/fruit,basket,market?lock=69990", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 4, "question_ar_full": "أيُّ قلمٍ في الحقيبة؟", "question_ar_blank": "____ قلمٍ في الحقيبة؟", "question_en": "Which pen is in the bag?", "correct": "أي", "image": "https://loremflickr.com/900/520/pens,school,supplies?lock=23423", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 1, "question_ar_full": "كم قلمًا في الحَقيبة؟", "question_ar_blank": "____ قلمًا في الحَقيبة؟", "question_en": "How many pens are in the bag?", "correct": "كم", "image": "https://loremflickr.com/900/520/bag,pens,school?lock=76065", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 5, "question_ar_full": "أين المَسجِد؟", "question_ar_blank": "____ المَسجِد؟", "question_en": "Where is the mosque?", "correct": "أين", "image": "https://loremflickr.com/900/520/mosque,building?lock=27418", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 2, "question_ar_full": "أين القَلَم؟", "question_ar_blank": "____ القَلَم؟", "question_en": "Where is the pen?", "correct": "أين", "image": "https://loremflickr.com/900/520/pen,desk,school?lock=36961", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 8, "question_ar_full": "أيُّ كِتَابٍ تَقْرَأُ؟", "question_ar_blank": "____ كِتَابٍ تَقْرَأُ؟", "question_en": "Which book are you reading?", "correct": "أي", "image": "https://loremflickr.com/900/520/book,reading,library?lock=92093", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 19, "question_ar_full": "كم رِيَالاً مَعَك؟", "question_ar_blank": "____ رِيَالاً مَعَك؟", "question_en": "How many Riyals do you have?", "correct": "كم", "image": "https://loremflickr.com/900/520/money,wallet,cash?lock=88880", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 7, "question_ar_full": "كم طَالِباً في المَدرَسَة؟", "question_ar_blank": "____ طَالِباً في المَدرَسَة؟", "question_en": "How many students are in the school?", "correct": "كم", "image": "https://loremflickr.com/900/520/students,school,classroom?lock=1224", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 17, "question_ar_full": "أين تَذْهَب؟", "question_ar_blank": "____ تَذْهَب؟", "question_en": "Where are you going?", "correct": "أين", "image": "https://loremflickr.com/900/520/walking,street,city?lock=19814", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 15, "question_ar_full": "كم دَفْتَراً عِنْدَك؟", "question_ar_blank": "____ دَفْتَراً عِنْدَك؟", "question_en": "How many notebooks do you have?", "correct": "كم", "image": "https://loremflickr.com/900/520/notebooks,school,desk?lock=45016", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 11, "question_ar_full": "كم سَاعَةً تَنَام؟", "question_ar_blank": "____ سَاعَةً تَنَام؟", "question_en": "How many hours do you sleep?", "correct": "كم", "image": "https://loremflickr.com/900/520/sleep,bedroom,clock?lock=13698", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 21, "question_ar_full": "أين الحَقِيبَة؟", "question_ar_blank": "____ الحَقِيبَة؟", "question_en": "Where is the bag?", "correct": "أين", "image": "https://loremflickr.com/900/520/bag,school,desk?lock=36303", "mark": 4.8, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 13, "question_ar_full": "أين الكِتَاب؟", "question_ar_blank": "____ الكِتَاب؟", "question_en": "Where is the book?", "correct": "أين", "image": "https://loremflickr.com/900/520/book,table,school?lock=16422", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 20, "question_ar_full": "أيُّ لَوْنٍ تُفَضِّل؟", "question_ar_blank": "____ لَوْنٍ تُفَضِّل؟", "question_en": "Which color do you prefer?", "correct": "أي", "image": "https://loremflickr.com/900/520/colors,pencils,paint?lock=18873", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 12, "question_ar_full": "أيُّ اللُّغاتِ تَدْرُس؟", "question_ar_blank": "____ اللُّغاتِ تَدْرُس؟", "question_en": "Which languages do you study?", "correct": "أي", "image": "https://loremflickr.com/900/520/language,study,books?lock=24702", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 110, "question_ar_full": "أين تَعْمَل؟", "question_ar_blank": "____ تَعْمَل؟", "question_en": "Where do you work?", "correct": "أين", "image": "https://loremflickr.com/900/520/office,workplace?lock=17940", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] },
  { "id": 111, "question_ar_full": "متى يَصِلُ الحَافِلَة؟", "question_ar_blank": "____ يَصِلُ الحَافِلَة؟", "question_en": "When does the bus arrive?", "correct": "متى", "image": "https://loremflickr.com/900/520/bus,station,street?lock=57927", "mark": 4.76, "choices": ["كم", "أين", "متى", "أي"] }
];

const commonPhrasesQuestions: Question[] = [
  { id: 901, question_ar: "كيف تقول 'What’s your name?' باللغة العربية؟", question_en: "How do you say 'What’s your name?' in Arabic?", correct: "مَا اسْمُك؟", choices: ["مَا اسْمُك؟", "كَيْفَ حَالُك؟", "أَيْنَ الْحَمَّام؟", "مَاذَا تَعْمَل؟"], mark: 5 },
  { id: 902, question_ar: "ما معنى 'اسْمِي هُو' باللغة الإنجليزية؟", question_en: "What does 'Esmī huwa' mean in English?", correct: "My name is...", choices: ["My name is...", "I am fine", "Thank you", "Please"], mark: 5 },
  { id: 903, question_ar: "كيف تسأل 'How are you?' باللغة العربية؟", question_en: "How do you ask 'How are you?' in Arabic?", correct: "كَيْفَ حَالُك؟", choices: ["كَيْفَ حَالُك؟", "مَا اسْمُك؟", "أَيْنَ الْحَمَّام؟", "مَاذَا تَعْمَل؟"], mark: 5 },
  { id: 904, question_ar: "ما هو الرد المناسب لـ 'كَيْفَ حَالُك؟'؟", question_en: "What is the appropriate response to 'Kayfa ħāluk'?", correct: "أَنَا بِخَيْر", choices: ["أَنَا بِخَيْر", "شُكْرًا لَك", "عَفْوًا", "أَنَا آسِف"], mark: 5 },
  { id: 905, question_ar: "كيف تقول 'Please' باللغة العربية؟", question_en: "How do you say 'Please' in Arabic?", correct: "مِنْ فَضْلِك", choices: ["مِنْ فَضْلِك", "شُكْرًا لَك", "عَفْوًا", "أَنَا آسِف"], mark: 5 },
  { id: 906, question_ar: "كيف تقول 'Thank you' باللغة العربية؟", question_en: "How do you say 'Thank you' in Arabic?", correct: "شُكْرًا لَك", choices: ["شُكْرًا لَك", "عَفْوًا", "مِنْ فَضْلِك", "أَنَا بِخَيْر"], mark: 5 },
  { id: 907, question_ar: "ما معنى 'عَفْوًا' باللغة الإنجليزية؟", question_en: "What does 'ʿafwan' mean in English?", correct: "You’re welcome", choices: ["You’re welcome", "Thank you", "Please", "I’m sorry"], mark: 5 },
  { id: 908, question_ar: "كيف تقول 'I’m sorry' باللغة العربية؟", question_en: "How do you say 'I’m sorry' in Arabic?", correct: "أَنَا آسِف", choices: ["أَنَا آسِف", "أَنَا بِخَيْر", "مِنْ فَضْلِك", "شُكْرًا لَك"], mark: 5 },
  { id: 909, question_ar: "كيف تسأل 'Where is the bathroom?' باللغة العربية؟", question_en: "How do you ask 'Where is the bathroom?' in Arabic?", correct: "أَيْنَ الْحَمَّام؟", choices: ["أَيْنَ الْحَمَّام؟", "أَيْنَ مَحَطَّةُ الْخِدْمَة؟", "مَا اسْمُك؟", "كَيْفَ حَالُك؟"], mark: 5 },
  { id: 910, question_ar: "كيف تطلب المساعدة (Help!) باللغة العربية؟", question_en: "How do you call for help in Arabic?", correct: "مُسَاعَدَة!", choices: ["مُسَاعَدَة!", "شُرْطَة!", "أَنَا تَائِه", "أَنَا آسِف"], mark: 5 },
  { id: 911, question_ar: "كيف تقول 'Good morning' باللغة العربية؟", question_en: "How do you say 'Good morning' in Arabic?", correct: "صَبَاحُ الْخَيْر", choices: ["صَبَاحُ الْخَيْر", "مَسَاءُ الْخَيْر", "مَعَ السَّلَامَة", "تَفَضَّل"], mark: 5 },
  { id: 912, question_ar: "ما معنى 'مَعَ السَّلَامَة' باللغة الإنجليزية؟", question_en: "What does 'maʿa s-salāmah' mean in English?", correct: "Good bye", choices: ["Good bye", "Good morning", "Good afternoon", "Please, enter"], mark: 5 },
  { id: 913, question_ar: "كيف تخاطب الأب أو شخصاً غير معروف بـ 'Your Honor'؟", question_en: "How do you address a father or unknown person as 'Your Honor'?", correct: "حضرتك", choices: ["حضرتك", "سيادتك", "فخامتك", "سموك"], mark: 5 },
  { id: 914, question_ar: "كيف تسأل شخصاً 'What do you do?' باللغة العربية؟", question_en: "How do you ask someone 'What do you do?' in Arabic?", correct: "مَاذَا تَعْمَل؟", choices: ["مَاذَا تَعْمَل؟", "مَا مِهْنَتُك؟", "مَا اسْمُك؟", "كَيْفَ حَالُك؟"], mark: 5 },
  { id: 915, question_ar: "ما معنى 'طَبِيب' باللغة الإنجليزية؟", question_en: "What does 'Tabeeb' mean in English?", correct: "Doctor", choices: ["Doctor", "Nurse", "Teacher", "Driver"], mark: 5 },
  { id: 916, question_ar: "ما معنى 'مُدَرِّس' باللغة الإنجليزية؟", question_en: "What does 'Mudarris' mean in English?", correct: "Teacher", choices: ["Teacher", "Doctor", "Cook", "Driver"], mark: 5 },
  { id: 917, question_ar: "كيف تقول 'I’m lost' باللغة العربية؟", question_en: "How do you say 'I’m lost' in Arabic?", correct: "أَنَا تَائِه", choices: ["أَنَا تَائِه", "أَنَا بِخَيْر", "أَنَا آسِف", "مُسَاعَدَة!"], mark: 5 },
  { id: 918, question_ar: "كيف تنادي 'Police!' باللغة العربية؟", question_en: "How do you call 'Police!' in Arabic?", correct: "شُرْطَة!", choices: ["شُرْطَة!", "مُسَاعَدَة!", "أَنَا تَائِه", "أَنَا آسِف"], mark: 5 },
  { id: 919, question_ar: "كيف تقول 'I love you!' باللغة العربية؟", question_en: "How do you say 'I love you!' in Arabic?", correct: "أُحِبُّك", choices: ["أُحِبُّك", "أَفْتَقِدُك", "أَنَا مُتَيَّمٌ بِك", "حَيَاتِي بِدُونِكِ لَا شَيء"], mark: 5 },
  { id: 920, question_ar: "ما معنى 'أَفْتَقِدُك' باللغة الإنجليزية؟", question_en: "What does 'Aftaqiduk' mean in English?", correct: "I miss you", choices: ["I miss you", "I love you", "I am crazy about you", "I wish to spend my life with you"], mark: 5 }
];

const daysQuestions: Question[] = [
  { id: 201, question_ar: "إذا كان اليوم الأحد، فماذا نقول؟", question_en: "If today is Sunday, what do we say?", correct: "اليوم الأحد", choices: ["اليوم السبت", "اليوم الأحد", "اليوم الاثنين", "اليوم الثلاثاء"], mark: 6.67 },
  { id: 202, question_ar: "إذا كان اليوم الأحد، فما هو غداً؟", question_en: "If today is Sunday, what is tomorrow?", correct: "غداً الاثنين", choices: ["غداً الاثنين", "غداً الثلاثاء", "غداً الجمعة", "غداً الخميس"], mark: 6.67 },
  { id: 203, question_ar: "إذا كان اليوم الأحد، فماذا كان البارحة؟", question_en: "If today is Sunday, what was yesterday?", correct: "البارحة السبت", choices: ["البارحة السبت", "البارحة الجمعة", "البارحة الخميس", "البارحة الأربعاء"], mark: 6.67 },
  { id: 204, question_ar: ".......... يوم ولدت؟", question_en: "Which day were you born?", correct: "أي", choices: ["أي", "كم", "أين", "متى"], mark: 6.67 },
  { id: 205, question_ar: ".......... يوم تعمل في الأسبوع؟", question_en: "How many days do you work in a week?", correct: "كم", choices: ["كم", "متى", "ماذا", "مَنْ"], mark: 6.67 },
  { id: 206, question_ar: ".......... يوم تفضل؟", question_en: "Which day do you prefer?", correct: "أي", choices: ["أي", "مَنْ", "كيف", "ماذا"], mark: 6.67 },
  { id: 207, question_ar: "ما هو اليوم الذي يعني \"الرقم اثنين\" أو الثاني في ترتيب الأسبوع؟", question_en: "What is the day that means 'number two' or the second in the week's order?", correct: "يوم الاثنين", choices: ["يوم الاثنين", "يوم الأحد", "يوم الثلاثاء", "يوم الأربعاء"], mark: 6.67 },
  { id: 208, question_ar: "ما هو اليوم المشتق من الرقم \"ثلاثة\"؟", question_en: "What is the day derived from the number 'three'?", correct: "يوم الثلاثاء", choices: ["يوم الثلاثاء", "يوم الأربعاء", "يوم الخميس", "يوم السبت"], mark: 6.67 },
  { id: 209, question_ar: "ما هو اليوم الذي يعني \"الرابع\"؟", question_en: "What is the day that means 'the fourth'?", correct: "يوم الأربعاء", choices: ["يوم الأربعاء", "يوم الاثنين", "يوم السبت", "يوم الجمعة"], mark: 6.67 },
  { id: 210, question_ar: "ما هو اليوم المرتبط بالرقم \"خمسة\"؟", question_en: "What is the day associated with the number 'five'?", correct: "يوم الخميس", choices: ["يوم الخميس", "يوم الجمعة", "يوم الأحد", "يوم الاثنين"], mark: 6.67 },
  { id: 211, question_ar: "ما هو يوم صلاة الجماعة والاجتماع في الإسلام؟", question_en: "What is the day of congregational prayer and gathering in Islam?", correct: "يوم الجمعة", choices: ["يوم الجمعة", "يوم السبت", "يوم الاثنين", "يوم الأحد"], mark: 6.67 },
  { id: 212, question_ar: "ما هو اليوم الذي يعني لغوياً \"الراحة\"؟", question_en: "What is the day that linguistically means 'rest'?", correct: "يوم السبت", choices: ["يوم السبت", "يوم الأحد", "يوم الثلاثاء", "يوم الخميس"], mark: 6.67 },
  { id: 213, question_ar: "ما هو اليوم الذي يعني \"الواحد\" أو الأول في الترتيب؟", question_en: "What is the day that means 'the one' or the first in the order?", correct: "يوم الأحد", choices: ["يوم الأحد", "يوم الخميس", "يوم الأربعاء", "يوم الاثنين"], mark: 6.67 },
  { id: 214, question_ar: "يأتي يوم الاثنين مباشرة بعد:", question_en: "Monday comes directly after:", correct: "يوم الأحد", choices: ["يوم الأحد", "يوم الثلاثاء", "يوم السبت", "يوم الجمعة"], mark: 6.67 },
  { id: 215, question_ar: "اليوم الذي يسبق يوم الجمعة هو:", question_en: "The day that precedes Friday is:", correct: "يوم الخميس", choices: ["يوم الخميس", "يوم السبت", "يوم الأربعاء", "يوم الثلاثاء"], mark: 6.62 }
];

const greetingsQuestions: Question[] = [
  { id: 301, question_ar: "كيف تقول \"May peace be upon you\" باللغة العربية؟", question_en: "How do you say 'May peace be upon you' in Arabic?", correct: "السَّلَامُ عَلَيْكُم", choices: ["السَّلَامُ عَلَيْكُم", "صَبَاحُ الْخَيْر", "مَعَ السَّلَامَة", "تَفَضَّل"], mark: 6.67 },
  { id: 302, question_ar: "ما هو الرد المناسب على تحية \"السَّلَامُ عَلَيْكُم\"؟", question_en: "What is the appropriate response to 'Assalamu Alaikum'?", correct: "وَعَلَيْكُمُ السَّلَام", choices: ["صَبَاحُ النُّور", "وَعَلَيْكُمُ السَّلَام", "مَسَاءُ الْخَيْر", "بِكُلِّ سُرُور"], mark: 6.67 },
  { id: 303, question_ar: "كيف تحيي شخصاً في الصباح (Good morning)؟", question_en: "How do you greet someone in the morning?", correct: "صَبَاحُ الْخَيْر", choices: ["مَسَاءُ الْخَيْر", "سُرِرْتُ بِلِقَائِك", "صَبَاحُ الْخَيْر", "أَتَمَنَّى لَكَ يَوْمًا سَعِيدًا"], mark: 6.67 },
  { id: 304, question_ar: "ماذا تقول لشخص تقابله لأول مرة (Pleased to meet you)؟", question_en: "What do you say to someone you meet for the first time?", correct: "سُرِرْتُ بِلِقَائِك", choices: ["سُرِرْتُ بِلِقَائِك", "تَفَضَّل", "مَعَ السَّلَامَة", "كَيْفَ حَالُكَ؟"], mark: 6.67 },
  { id: 305, question_ar: "عندما تريد توديع شخص ما (Good bye)، ماذا تقول؟", question_en: "When you want to say goodbye to someone, what do you say?", correct: "مَعَ السَّلَامَة", choices: ["أَهْلًا وَسَهْلًا", "مَعَ السَّلَامَة", "صَبَاحُ الْخَيْر", "بِكُلِّ سُرُور"], mark: 6.67 },
  { id: 306, question_ar: "كيف تسأل شخصاً عن حاله (How are you)؟", question_en: "How do you ask someone how they are?", correct: "كَيْفَ حَالُكَ؟", choices: ["مَنْ أَنْتَ؟", "أَيْنَ تَعْمَل؟", "كَيْفَ حَالُكَ؟", "مَا اسْمُك؟"], mark: 6.67 },
  { id: 307, question_ar: "ما هي التحية المناسبة في وقت المساء (Good evening)؟", question_en: "What is the appropriate greeting in the evening?", correct: "مَسَاءُ الْخَيْر", choices: ["صَبَاحُ الْخَيْر", "مَسَاءُ الْخَيْر", "أَتَمَنَّى لَكَ يَوْمًا سَعِيدًا", "تَفَضَّل"], mark: 6.67 },
  { id: 308, question_ar: "ماذا تقول عندما تتمنى لشخص يوماً سعيداً (Have a nice day)؟", question_en: "What do you say when you wish someone a nice day?", correct: "أَتَمَنَّى لَكَ يَوْمًا سَعِيدًا", choices: ["أَتَمَنَّى لَكَ يَوْمًا سَعِيدًا", "سُرِرْتُ بِلِقَائِك", "بِكُلِّ سُرُور", "مَعَ السَّلَامَة"], mark: 6.67 },
  { id: 309, question_ar: "عندما تدعو شخصاً للدخول (Please, enter)، ماذا تقول؟", question_en: "When you invite someone to enter, what do you say?", correct: "تَفَضَّل", choices: ["شُكْرًا", "مَنْ هَذَا؟", "تَفَضَّل", "أَيُّ يَوْمٍ هَذَا؟"], mark: 6.67 },
  { id: 310, question_ar: "كيف تعبر عن سعادتك بفعل شيء ما (With pleasure)؟", question_en: "How do you express your pleasure in doing something?", correct: "بِكُلِّ سُرُور", choices: ["أَنَّى لَكَ هَذَا؟", "بِكُلِّ سُرُور", "لِمَاذَا؟", "مَتَى؟"], mark: 6.67 },
  { id: 311, question_ar: "ما هي الكلمة العربية التي تستخدم للترحيب العام (Welcome)؟", question_en: "What is the Arabic word used for a general welcome?", correct: "أَهْلًا وَسَهْلًا", choices: ["أَهْلًا وَسَهْلًا", "السَّبْت", "كَمْ؟", "مَنْ؟"], mark: 6.67 },
  { id: 312, question_ar: "كيف تشكر شخصاً ما باللغة العربية (Thank you)؟", question_en: "How do you thank someone in Arabic?", correct: "شُكْرًا", choices: ["لِمَاذَا؟", "أَيْنَ؟", "شُكْرًا", "هَلْ؟"], mark: 6.67 },
  { id: 313, question_ar: "ماذا تقول لطلب شيء ما بتهذب (Please)؟", question_en: "What do you say to request something politely?", correct: "مِنْ فَضْلِك", choices: ["مِنْ فَضْلِك", "كَيْفَ؟", "مَتَى؟", "مَاذَا؟"], mark: 6.67 },
  { id: 314, question_ar: "إذا سألك شخص \"كَيْفَ حَالُكَ؟\"، فما هو الرد التقليدي؟", question_en: "If someone asks you 'How are you?', what is the traditional response?", correct: "بِخَيْر، وَالْحَمْدُ لِلَّه", choices: ["صَبَاحُ الْخَيْر", "بِخَيْر، وَالْحَمْدُ لِلَّه", "مَعَ السَّلَامَة", "أَيُّ يَوْمٍ وُلِدْت؟"], mark: 6.67 },
  { id: 315, question_ar: "ما هي التهنئة المناسبة في شهر رمضان (Ramadan Greetings)؟", question_en: "What is the appropriate greeting during Ramadan?", correct: "رَمَضَان كَرِيم", choices: ["جُمُعَة مُبَارَكَة", "رَمَضَان كَرِيم", "صَبَاحُ الْخَيْر", "سُرِرْتُ بِلِقَائِك"], mark: 6.62 }
];

const numbersQuestions: Question[] = [
  { id: 401, question_ar: "ما هو ناتج واحد + واحد؟", question_en: "What is one plus one?", correct: "اثنان", choices: ["اثنان", "ثلاثة", "أربعة", "خمسة"], mark: 6.67 },
  { id: 402, question_ar: "ما هو ناتج اثنان + واحد؟", question_en: "What is two plus one?", correct: "ثلاثة", choices: ["واحد", "ثلاثة", "خمسة", "ستة"], mark: 6.67 },
  { id: 403, question_ar: "ما هو ناتج ثلاثة + اثنان؟", question_en: "What is three plus two?", correct: "خمسة", choices: ["أربعة", "خمسة", "ستة", "سبعة"], mark: 6.67 },
  { id: 404, question_ar: "ما هو ناتج خمسة - واحد؟", question_en: "What is five minus one?", correct: "أربعة", choices: ["ثلاثة", "أربعة", "اثنان", "واحد"], mark: 6.67 },
  { id: 405, question_ar: "ما هو ناتج أربعة + اثنان؟", question_en: "What is four plus two?", correct: "ستة", choices: ["خمسة", "ستة", "ثمانية", "عشرة"], mark: 6.67 },
  { id: 406, question_ar: "ما هو ناتج عشرة - ثلاثة؟", question_en: "What is ten minus three?", correct: "سبعة", choices: ["ستة", "سبعة", "ثمانية", "تسعة"], mark: 6.67 },
  { id: 407, question_ar: "ما هو ناتج أربعة + أربعة؟", question_en: "What is four plus four?", correct: "ثمانية", choices: ["ستة", "سبعة", "ثمانية", "تسعة"], mark: 6.67 },
  { id: 408, question_ar: "ما هو ناتج سبعة + اثنان؟", question_en: "What is seven plus two?", correct: "تسعة", choices: ["ثمانية", "تسعة", "عشرة", "خمسة"], mark: 6.67 },
  { id: 409, question_ar: "ما هو ناتج خمسة + خمسة؟", question_en: "What is five plus five?", correct: "عشرة", choices: ["ثمانية", "تسعة", "عشرة", "سبعة"], mark: 6.67 },
  { id: 410, question_ar: "ما هو ناتج اثنان - واحد؟", question_en: "What is two minus one?", correct: "واحد", choices: ["واحد", "صفر", "اثنان", "ثلاثة"], mark: 6.67 },
  { id: 411, question_ar: "ما هو الرقم المرتبط بيوم \"الأحد\" (the first)؟", question_en: "What is the number associated with Sunday?", correct: "واحد", choices: ["واحد", "اثنان", "ثلاثة", "أربعة"], mark: 6.67 },
  { id: 412, question_ar: "ما هو الرقم المرتبط بيوم \"الثلاثاء\" (derived from three)؟", question_en: "What is the number associated with Tuesday?", correct: "ثلاثة", choices: ["اثنان", "ثلاثة", "أربعة", "خمسة"], mark: 6.67 },
  { id: 413, question_ar: "ما هو الرقم المرتبط بيوم \"الخميس\" (relates to five)؟", question_en: "What is the number associated with Thursday?", correct: "خمسة", choices: ["أربعة", "خمسة", "ستة", "سبعة"], mark: 6.67 },
  { id: 414, question_ar: "ما هو ناتج ستة + واحد؟", question_en: "What is six plus one?", correct: "سبعة", choices: ["خمسة", "ستة", "سبعة", "ثمانية"], mark: 6.67 },
  { id: 415, question_ar: "ما هو ناتج ثمانية + اثنان؟", question_en: "What is eight plus two?", correct: "عشرة", choices: ["تسعة", "عشرة", "سبعة", "ثمانية"], mark: 6.62 }
];

const pronounsQuestions: Question[] = [
  { id: 501, question_ar: "كيف تقول \"I am a student\" باللغة العربية؟", question_en: "How do you say 'I am a student' in Arabic?", correct: "أنا طالب", choices: ["هو طالب", "أنت طالب", "أنا طالب", "نحن طالب"], mark: 6.67 },
  { id: 502, question_ar: "ما هو الضمير المناسب للتعبير عن \"We are friends\"؟", question_en: "What is the appropriate pronoun for 'We are friends'?", correct: "نحن أصدقاء", choices: ["أنا أصدقاء", "نحن أصدقاء", "هم أصدقاء", "أنتم أصدقاء"], mark: 6.67 },
  { id: 503, question_ar: "كيف تخاطب معلماً واحداً (You are a teacher)؟", question_en: "How do you address one male teacher?", correct: "أنت معلّم", choices: ["أنت معلّم", "أنتِ معلّم", "أنتما معلّم", "أنتم معلّم"], mark: 6.67 },
  { id: 504, question_ar: "ما هو الضمير المناسب للمخاطبة المؤنثة (You are a student)؟", question_en: "What is the appropriate pronoun for a female student?", correct: "أنتِ طالبة", choices: ["أنتَ طالبة", "أنتِ طالبة", "هو طالبة", "نحن طالبة"], mark: 6.67 },
  { id: 505, question_ar: "\".......... مجتهدان\" (You two are diligent). ما هو الضمير المناسب للمثنى؟", question_en: "'.......... diligent'. What is the appropriate pronoun for two people?", correct: "أنتما", choices: ["أنتم", "أنتما", "أنتَ", "هو"], mark: 6.67 },
  { id: 506, question_ar: "كيف تخاطب مجموعة من الأذكياء (You are smart - plural m.)؟", question_en: "How do you address a group of smart people?", correct: "أنتم أذكياء", choices: ["أنتَ أذكياء", "أنتم أذكياء", "أنتِ أذكياء", "نحن أذكياء"], mark: 6.67 },
  { id: 507, question_ar: "ما هو الضمير المستخدم لمخاطبة جمع الإناث (You are students)؟", question_en: "What is the pronoun used to address a group of female students?", correct: "أنتن طالبات", choices: ["أنتم طالبات", "أنتن طالبات", "أنتما طالبات", "هم طالبات"], mark: 6.67 },
  { id: 508, question_ar: "كيف تقول \"He is a doctor\" باللغة العربية؟", question_en: "How do you say 'He is a doctor' in Arabic?", correct: "هو طبيب", choices: ["هي طبيب", "هو طبيب", "أنا طبيب", "هما طبيب"], mark: 6.67 },
  { id: 509, question_ar: "ما هو الضمير المناسب لوصف ممرضة غائبة (She is a nurse)؟", question_en: "What is the appropriate pronoun to describe a female nurse?", correct: "هي ممرضة", choices: ["هو ممرضة", "هي ممرضة", "هما ممرضة", "هن ممرضة"], mark: 6.67 },
  { id: 510, question_ar: "\".......... طالبان\" (They two are students). ما هو الضمير المناسب للمثنى الغائب؟", question_en: "'.......... students'. What is the appropriate pronoun for two absent students?", correct: "هما", choices: ["هم", "هما", "هو", "نحن"], mark: 6.67 },
  { id: 511, question_ar: "كيف تتحدث عن مجموعة من المهندسين (They are engineers)؟", question_en: "How do you talk about a group of male engineers?", correct: "هم مهندسون", choices: ["هو مهندسون", "هما مهندسون", "هم مهندسون", "هن مهندسون"], mark: 6.67 },
  { id: 512, question_ar: "ما هو الضمير المناسب لجمع الإناث الغائبات (They are teachers)؟", question_en: "What is the appropriate pronoun for a group of absent female teachers?", correct: "هن معلّمات", choices: ["هم معلّمات", "هن معلّمات", "هما معلّمات", "هو معلّمات"], mark: 6.67 },
  { id: 513, question_ar: "إذا أردت سؤال شخص \"Are you from Egypt?\"، أي ضمير تستخدم؟", question_en: "If you want to ask 'Are you from Egypt?', which pronoun do you use?", correct: "أنت", choices: ["أنا", "أنت", "هو", "نحن"], mark: 6.67 },
  { id: 514, question_ar: "في جملة \"أنا أدرس\" (I am studying)، ما نوع كلمة \"أنا\"؟", question_en: "In the sentence 'I am studying', what type of word is 'Anā'?", correct: "اسم/ضمير (Noun/Pronoun)", choices: ["فعل (Verb)", "اسم/ضمير (Noun/Pronoun)", "حرف (Particle)", "رقم (Number)"], mark: 6.67 },
  { id: 515, question_ar: "ما هو الضمير الذي يحل محل \"المستفهم عنه\" عندما نسأل \"مَنْ أنت؟\" (Who are you)؟", question_en: "Which pronoun replaces the subject when we ask 'Who are you'?", correct: "أنت", choices: ["أنت", "مَنْ", "هما", "هُنَّ"], mark: 6.62 }
];

const demonstrativeQuestions: Question[] = [
  { id: 601, question_ar: "ما هو اسم الإشارة المناسب للمفرد المذكر (This is my brother)؟", question_en: "What is the appropriate demonstrative for singular masculine?", correct: "هَذَا", choices: ["هَذَا", "هَذِهِ", "هَؤُلَاءِ", "هَاتَانِ"], mark: 6.67 },
  { id: 602, question_ar: "كيف تشير إلى أختك (This is my sister) باللغة العربية؟", question_en: "How do you point to your sister in Arabic?", correct: "هَذِهِ", choices: ["هَذَا", "هَذِهِ", "هَذَانِ", "هُمْ"], mark: 6.67 },
  { id: 603, question_ar: "ماذا تقول عندما تشير إلى كتاب (This is a book)؟", question_en: "What do you say when pointing to a book?", correct: "هَذَا كِتَاب", choices: ["هَذِهِ كِتَاب", "هَذَا كِتَاب", "هَؤُلَاءِ كِتَاب", "أَنَا كِتَاب"], mark: 6.67 },
  { id: 604, question_ar: "كيف تشير إلى قطة (This is a cat)؟", question_en: "How do you point to a cat?", correct: "هَذِهِ قِطَّة", choices: ["هَذَا قِطَّة", "هَؤُلَاءِ قِطَّة", "هَذِهِ قِطَّة", "هُمَا قِطَّة"], mark: 6.67 },
  { id: 605, question_ar: "ما هو اسم الإشارة لجمع المذكر والمؤنث (These youths/women)؟", question_en: "What is the demonstrative for plural masculine and feminine?", correct: "هَؤُلَاءِ", choices: ["هَذَا", "هَذِهِ", "هَؤُلَاءِ", "هَاتَانِ"], mark: 6.67 },
  { id: 606, question_ar: "\".......... الرَّجُلَانِ أَبِي وَعَمِّي\" (These two men are my father and uncle).", question_en: "'.......... these two men'. Which demonstrative fits for dual masculine?", correct: "هَذَانِ", choices: ["هَذَا", "هَذَانِ", "هَاتَانِ", "هَؤُلَاءِ"], mark: 6.67 },
  { id: 607, question_ar: "\".......... البِنْتَانِ أُخْتَاي\" (These two girls are my sisters).", question_en: "'.......... these two girls'. Which demonstrative fits for dual feminine?", correct: "هَاتَانِ", choices: ["هَذَانِ", "هَؤُلَاءِ", "هَاتَانِ", "هَذِهِ"], mark: 6.67 },
  { id: 608, question_ar: "أي من الكلمات التالية يُستخدم للإشارة للقريب المذكر؟", question_en: "Which of the following words is used to point to a nearby male?", correct: "هَذَا", choices: ["هَذَا", "مَنْ", "نَحْنُ", "أَنْتَ"], mark: 6.67 },
  { id: 609, question_ar: "ما هو اسم الإشارة المستخدم في \"هَؤُلَاءِ النِّسَاءُ مُمَرِّضَاتٌ\"؟", question_en: "What is the demonstrative pronoun used in 'These women are nurses'?", correct: "هَؤُلَاءِ", choices: ["هَذِهِ", "هَاتَانِ", "هَؤُلَاءِ", "أَنْتُنَّ"], mark: 6.67 },
  { id: 610, question_ar: "عندما نسأل \"مَنْ هَذَا؟\" (Who is this?), فإننا نسأل عن:", question_en: "When we ask 'Who is this?', we are asking about:", correct: "شخص عاقل مذكر", choices: ["شيء غير عاقل", "شخص عاقل مذكر", "مكان", "زمان"], mark: 6.67 },
  { id: 611, question_ar: "ما هي الكلمة المناسبة للإشارة إلى \"زوجة صالح\" (This is Salih's wife)؟", question_en: "What is the correct word to point to 'Salih's wife'?", correct: "هَذِهِ", choices: ["هَذَا", "هَذِهِ", "هَذَانِ", "هَؤُلَاءِ"], mark: 6.67 },
  { id: 612, question_ar: "أي من هذه الخيارات يعتبر \"اسم إشارة\" (Demonstrative Pronoun)؟", question_en: "Which of these options is considered a 'Demonstrative Pronoun'?", correct: "هَذَا", choices: ["أَنَا", "كَيْفَ", "هَذَا", "شُكْرًا"], mark: 6.67 },
  { id: 613, question_ar: "\".......... الشَّبَابُ أَصْدِقَائِي\" (These youths are my friends).", question_en: "Complete the sentence with the correct plural demonstrative.", correct: "هَؤُلَاءِ", choices: ["هَذَا", "هَذِهِ", "هَذَانِ", "هَؤُلَاءِ"], mark: 6.67 },
  { id: 614, question_ar: "اسم الإشارة \"هَذِهِ\" يُستخدم مع:", question_en: "The demonstrative 'Hādhihi' is used with:", correct: "المفرد المؤنث", choices: ["المفرد المذكر", "المفرد المؤنث", "المثنى المذكر", "الجمع المذكر"], mark: 6.67 },
  { id: 615, question_ar: "كيف تشير إلى شخصين مذكرين أمامك؟", question_en: "How do you point to two males in front of you?", correct: "هَذَانِ", choices: ["هَذَانِ", "هَاتَانِ", "هَؤُلَاءِ", "هَذِهِ"], mark: 6.62 }
];

const nisbaQuestions: Question[] = [
  { id: 701, question_ar: "ماذا نضيف إلى نهاية الاسم لتحويله إلى صفة نسبة للمذكر؟", question_en: "What do we add to the end of a noun to form a masculine Nisba adjective?", correct: "ـيّ (ياء مشددة)", choices: ["ـيّ (ياء مشددة)", "ـات", "الـ", "ـون"], mark: 6.67 },
  { id: 702, question_ar: "كيف نصيغ صفة النسبة للمؤنث (مثل ممرضة أردنية)؟", question_en: "How do we form a feminine Nisba adjective?", correct: "إضافة (ـيّة)", choices: ["إضافة (ـيّ) فقط", "إضافة (ـيّة)", "حذف الياء", "إضافة (الـ) في النهاية"], mark: 6.67 },
  { id: 703, question_ar: "عند النسبة إلى \"الأردن\"، ما هي الخطوة الأولى؟", question_en: "When forming a Nisba from 'al-Urdun', what is the first step?", correct: "حذف \"الـ\" التعريف", choices: ["إضافة تاء مربوطة", "حذف \"الـ\" التعريف", "حذف النون", "إضافة ألف"], mark: 6.67 },
  { id: 704, question_ar: "ما هي صفة النسبة المذكرة من كلمة \"السُّعودية\"؟", question_en: "What is the masculine Nisba adjective from 'al-Saudia'?", correct: "سُعوديّ", choices: ["سُعودية", "سُعوديّ", "السُّعود", "سُعوداً"], mark: 6.67 },
  { id: 705, question_ar: "كيف تتحول كلمة \"أمريكا\" إلى صفة نسبة (American)؟", question_en: "How does 'Amrika' change into a Nisba adjective?", correct: "حذف الألف الأخيرة وإضافة (ـيّ)", choices: ["حذف الألف الأولى", "إضافة (ـيّ) بدون حذف", "حذف الألف الأخيرة وإضافة (ـيّ)", "حذف الميم"], mark: 6.67 },
  { id: 706, question_ar: "الكلمة \"موريتانيا\" تنتهي بـ \"ـيا\"، فماذا نفعل لصياغة النسبة؟", question_en: "'Mauritania' ends in 'ya-alif', what do we do to form the Nisba?", correct: "نحذف (ـيا) ونضيف (ـيّ)", choices: ["نبقيها كما هي", "نحذف (ـيا) ونضيف (ـيّ)", "نضيف تاء مربوطة فقط", "نحذف الميم"], mark: 6.67 },
  { id: 707, question_ar: "ما هي صفة النسبة الصحيحة لوصف امرأة من \"الأردن\"؟", question_en: "What is the correct Nisba adjective to describe a woman from Jordan?", correct: "أردنيّة", choices: ["أردنيّ", "أردنيّة", "الأردن", "أردنيات"], mark: 6.67 },
  { id: 708, question_ar: "في جملة \"الأدب الأمريكيّ\"، لماذا أضفنا \"الـ\" لصفة النسبة؟", question_en: "In 'The American Literature', why did we add 'al-' to the Nisba adjective?", correct: "للمطابقة مع الاسم المعرف (الأدب)", choices: ["لأنها مذكر", "لأنها مؤنث", "للمطابقة مع الاسم المعرف (الأدب)", "لأنها في نهاية الجملة"], mark: 6.67 },
  { id: 710, question_ar: "ما هي الوظيفة الأساسية لياء النسبة؟", question_en: "What is the primary function of the Nisba suffix?", correct: "تحويل الاسم إلى صفة", choices: ["تحويل الفعل إلى اسم", "تحويل الاسم إلى صفة", "الجمع", "التعريف"], mark: 6.67 },
  { id: 711, question_ar: "عند النسبة لاسم ينتهي بتاء مربوطة (مثل \"مكة\")، ماذا نفعل بالتاء؟", question_en: "When forming a Nisba from a noun ending in Taa Marbuuta, what do we do with it?", correct: "نحذفها قبل إضافة الياء", choices: ["نبقيها كما هي", "نحذفها قبل إضافة الياء", "نحولها إلى ألف", "نضع فوقها سكون"], mark: 6.67 },
  { id: 712, question_ar: "كيف نقول \"English Literature\" باللغة العربية؟", question_en: "How do we say 'English Literature' in Arabic?", correct: "الأدب الإنجليزيّ", choices: ["أدب إنجلترا", "الأدب الإنجليزيّ", "إنجليزي أدب", "أدب الإنجليز"], mark: 6.67 },
  { id: 713, question_ar: "ما هو أصل الكلمة (Stem) لصفة النسبة \"موريتانيّ\"؟", question_en: "What is the stem of the Nisba adjective 'Mauritāniy'?", correct: "موريتان", choices: ["موريتاني", "موريتان", "موريتانيا", "تانيا"], mark: 6.67 },
  { id: 714, question_ar: "لماذا نضع \"شَدّة\" على الياء في صفة النسبة (سعوديّ)؟", question_en: "Why do we put a 'Shadda' on the Yaa in a Nisba adjective?", correct: "لأنها قاعدة نحوية أساسية في النسبة", choices: ["للزينة فقط", "لأنها قاعدة نحوية أساسية في النسبة", "لأنها حرف مد", "لالدلالة على الجمع"], mark: 6.67 },
  { id: 715, question_ar: "ما هي صفة النسبة المذكرة من \"مِصْر\"؟", question_en: "What is the masculine Nisba adjective from 'Misr'?", correct: "مِصْريّ", choices: ["مِصْرية", "مِصْراً", "مِصْريّ", "المِصْر"], mark: 6.62 }
];

const prepositionsQuestions: Question[] = [
  { id: 801, question_ar: "جئتُ ____ البيتِ. (I came from the house)", question_en: "I came from the house.", correct: "مِنْ", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 802, question_ar: "ذهبتُ ____ المدرسةِ. (I went to the school)", question_en: "I went to the school.", correct: "إِلَى", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 803, question_ar: "الكتابُ ____ الحقيبةِ. (The book is in the bag)", question_en: "The book is in the bag.", correct: "فِي", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 804, question_ar: "القلمُ ____ الطاولةِ. (The pen is on the table)", question_en: "The pen is on the table.", correct: "عَلَى", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 805, question_ar: "كتبتُ ____ القلمِ. (I wrote with the pen)", question_en: "I wrote with the pen.", correct: "بِـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 806, question_ar: "هذا الكتابُ ____ الطالبِ. (This book is for the student)", question_en: "This book is for the student.", correct: "لِـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 807, question_ar: "تحدثنا ____ الدرسِ. (We talked about the lesson)", question_en: "We talked about the lesson.", correct: "عَنْ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 808, question_ar: "هو شجاعٌ ____ الأسدِ. (He is brave like a lion)", question_en: "He is brave like a lion.", correct: "كَـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 809, question_ar: "انتظرتُ ____ المساءِ. (I waited until evening)", question_en: "I waited until evening.", correct: "حَتَّى", choices: ["حَتَّى", "مُنْذُ", "فِي", "إِلَى"], mark: 5 },
  { id: 810, question_ar: "ما رأيتُه ____ يومينِ. (I haven't seen him for two days)", question_en: "I haven't seen him for two days.", correct: "مُنْذُ", choices: ["حَتَّى", "مُنْذُ", "فِي", "إِلَى"], mark: 5 },
  { id: 811, question_ar: "هذه هدية ____ صديقي. (This is a gift from my friend)", question_en: "This is a gift from my friend.", correct: "مِنْ", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 812, question_ar: "انظر ____ السماءِ. (Look at the sky)", question_en: "Look at the sky.", correct: "إِلَى", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 813, question_ar: "أعيشُ ____ بغدادَ. (I live in Baghdad)", question_en: "I live in Baghdad.", correct: "فِي", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 814, question_ar: "السلامُ ____ الجميعِ. (Peace be upon everyone)", question_en: "Peace be upon everyone.", correct: "عَلَى", choices: ["مِنْ", "إِلَى", "فِي", "عَلَى"], mark: 5 },
  { id: 815, question_ar: "مررتُ ____ البيتِ. (I passed by the house)", question_en: "I passed by the house.", correct: "بِـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 816, question_ar: "قلتُ الحقيقةَ ____ المعلمِ. (I told the truth to the teacher)", question_en: "I told the truth to the teacher.", correct: "لِـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 817, question_ar: "ابتعدَ ____ الطريقِ. (He moved away from the road)", question_en: "He moved away from the road.", correct: "عَنْ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 818, question_ar: "عملتُ ____ معلّمٍ. (I worked as a teacher)", question_en: "I worked as a teacher.", correct: "كَـ", choices: ["بِـ", "لِـ", "كَـ", "عَنْ"], mark: 5 },
  { id: 819, question_ar: "أكلتُ السمكةَ ____ رأسِها. (I ate the fish up to its head)", question_en: "I ate the fish up to its head.", correct: "حَتَّى", choices: ["حَتَّى", "مُنْذُ", "فِي", "إِلَى"], mark: 5 },
  { id: 820, question_ar: "هو هنا ____ الصباحِ. (He has been here since morning)", question_en: "He has been here since morning.", correct: "مُذْ", choices: ["حَتَّى", "مُنْذُ", "مُذْ", "إِلَى"], mark: 5 },
];

const arabicLettersQuestions: Question[] = [
  { id: 1, question_ar: "كم عدد الحروف الأساسية في الأبجدية العربية؟", question_en: "How many primary letters are in the Arabic alphabet?", correct: "28", choices: ["26", "28", "30", "24"], mark: 5 },
  { id: 2, question_ar: "أي من هذه الحروف يعتبر حرفاً \"غير متصل\" (Stubborn letter)؟", question_en: "Which of these is a 'non-connector' letter?", correct: "د", choices: ["ب", "ت", "ج", "د"], mark: 5 },
  { id: 3, question_ar: "كم عدد الحروف التي لا تتصل بما بعدها (Non-connectors)؟", question_en: "How many letters do not connect to what follows them?", correct: "6", choices: ["4", "5", "6", "7"], mark: 5 },
  { id: 4, question_ar: "ما هو الشكل الابتدائي لحرف الباء (ب)؟", question_en: "What is the initial form of the letter Bā’?", correct: "بـ", choices: ["ب", "بـ", "ـبـ", "ـب"], mark: 5 },
  { id: 5, question_ar: "ما هو الشكل المتوسط لحرف التاء (ت)؟", question_en: "What is the medial form of the letter Tā’?", correct: "ـتـ", choices: ["تـ", "ـتـ", "ـت", "ت"], mark: 5 },
  { id: 6, question_ar: "ما هو الشكل النهائي لحرف الجيم (ج)؟", question_en: "What is the final form of the letter Jīm?", correct: "ـج", choices: ["جـ", "ـجـ", "ـج", "ج"], mark: 5 },
  { id: 7, question_ar: "أي حرف يتغير شكله بشكل جذري في البداية (مثل عـ)؟", question_en: "Which letter changes its shape drastically in the initial position?", correct: "ع", choices: ["ب", "د", "ع", "ل"], mark: 5 },
  { id: 8, question_ar: "ما هو الشكل الخاص لاتصال حرفي اللام والألف؟", question_en: "What is the special ligature for Lām and Alif?", correct: "لا", choices: ["لـا", "لا", "ـلا", "لأ"], mark: 5 },
  { id: 9, question_ar: "كيف يتصل حرف الألف (أ)؟", question_en: "How does the letter Alif connect?", correct: "يتصل بما قبله فقط", choices: ["يتصل بما قبله فقط", "يتصل بما بعده فقط", "يتصل من الجهتين", "لا يتصل أبداً"], mark: 5 },
  { id: 10, question_ar: "ما هو الشكل الابتدائي لحرف الياء (ي)؟", question_en: "What is the initial form of the letter Yā’?", correct: "يـ", choices: ["ي", "يـ", "ـيـ", "ـي"], mark: 5 },
  { id: 11, question_ar: "ما هو الشكل النهائي لحرف النون (ن)؟", question_en: "What is the final form of the letter Nūn?", correct: "ـن", choices: ["نـ", "ـنـ", "ـن", "ن"], mark: 5 },
  { id: 12, question_ar: "أي من هذه الحروف لا يتصل بما بعده؟", question_en: "Which of these letters does NOT connect to the following letter?", correct: "و", choices: ["س", "ف", "و", "ك"], mark: 5 },
  { id: 13, question_ar: "ما هو الشكل المتوسط لحرف الحاء (ح)؟", question_en: "What is the medial form of the letter Ḥā’?", correct: "ـحـ", choices: ["حـ", "ـحـ", "ـح", "ح"], mark: 5 },
  { id: 14, question_ar: "كيف يكتب حرف الراء (ر) بعد حرف غير متصل مثل الألف (أ)؟", question_en: "How is the letter Rā’ written after a non-connector like Alif?", correct: "منفصلاً (أر)", choices: ["متصلاً (أر)", "منفصلاً (أر)", "فوق الألف", "تحت الألف"], mark: 5 },
  { id: 15, question_ar: "ما هو الشكل النهائي لحرف التاء (ت)؟", question_en: "What is the final form of the letter Tā’?", correct: "ـت", choices: ["تـ", "ـتـ", "ـت", "ت"], mark: 5 },
  { id: 16, question_ar: "أي من هذه الحروف يعتبر حرفاً \"عنيداً\" (Stubborn)؟", question_en: "Which of these letters is considered 'stubborn'?", correct: "د", choices: ["م", "ل", "د", "س"], mark: 5 },
  { id: 17, question_ar: "ما هو الشكل الابتدائي لحرف الخاء (خ)؟", question_en: "What is the initial form of the letter Khā’?", correct: "خـ", choices: ["خ", "خـ", "ـخـ", "ـخ"], mark: 5 },
  { id: 18, question_ar: "ما هو الشكل المتوسط لحرف السين (س)؟", question_en: "What is the medial form of the letter Sīn?", correct: "ـسـ", choices: ["سـ", "ـسـ", "ـس", "س"], mark: 5 },
  { id: 19, question_ar: "ما هو الشكل النهائي لحرف الميم (م)؟", question_en: "What is the final form of the letter Mīm?", correct: "ـم", choices: ["مـ", "ـمـ", "ـم", "م"], mark: 5 },
  { id: 20, question_ar: "هل يتصل حرف الواو (و) بالحرف الذي يليه؟", question_en: "Does the letter Wāw connect to the letter after it?", correct: "لا", choices: ["نعم", "لا", "أحياناً", "فقط مع الألف"], mark: 5 }
];

const conjunctionsQuestions: Question[] = [
  { id: 1001, question_ar: "جاءَ مُحَمَّدٌ ____ عَلِيٌّ. (Muhammad and Ali came)", question_en: "Muhammad and Ali came.", correct: "وَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1002, question_ar: "أُحِبُّ التُّفّاحَ ____ الموزَ. (I like apples and bananas)", question_en: "I like apples and bananas.", correct: "وَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1003, question_ar: "دَرَسَ الطالِبُ ____ نَجَحَ. (The student studied, so he succeeded - immediately)", question_en: "The student studied, so he succeeded.", correct: "فَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1004, question_ar: "دَخَلَ المُعَلِّمُ ____ وَقَفَ الطُّلّابُ. (The teacher entered, so the students stood up - immediately)", question_en: "The teacher entered, so the students stood up.", correct: "فَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1005, question_ar: "أَكَلْتُ ____ شَرِبْتُ. (I ate, then I drank - with delay)", question_en: "I ate, then I drank.", correct: "ثُمَّ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1006, question_ar: "ذَهَبْنا إلى السّوقِ ____ إلى البَيْتِ. (We went to the market, then to the house - with delay)", question_en: "We went to the market, then to the house.", correct: "ثُمَّ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1007, question_ar: "هَلْ تُرِيدُ شايًا ____ قَهْوَةً؟ (Do you want tea or coffee?)", question_en: "Do you want tea or coffee?", correct: "أَوْ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1008, question_ar: "اِقْرَأْ الكِتابَ ____ اكْتُبِ الوَاجِبَ. (Read the book or write the homework)", question_en: "Read the book or write the homework.", correct: "أَوْ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1009, question_ar: "أُحِبُّ الخُروجَ ____ أَنَا مُتْعَبٌ. (I want to go out, but I am tired)", question_en: "I want to go out, but I am tired.", correct: "لَكِنْ", choices: ["وَ", "فَ", "ثُمَّ", "لَكِنْ"], mark: 5 },
  { id: 1010, question_ar: "الكِتابُ صَغيرٌ ____ مُفيدٌ. (The book is small, but useful)", question_en: "The book is small, but useful.", correct: "لَكِنْ", choices: ["وَ", "فَ", "ثُمَّ", "لَكِنْ"], mark: 5 },
  { id: 1011, question_ar: "ما هذا قَلَمًا ____ رِصاصَةٌ. (This is not a pen, rather it is a pencil)", question_en: "This is not a pen, rather it is a pencil.", correct: "بَلْ", choices: ["وَ", "فَ", "بَلْ", "أَوْ"], mark: 5 },
  { id: 1012, question_ar: "لَمْ يَذْهَبْ أَحْمَدُ ____ عَلِيٌّ. (Ahmad did not go; rather, Ali did)", question_en: "Ahmad did not go; rather, Ali did.", correct: "بَلْ", choices: ["وَ", "فَ", "بَلْ", "أَوْ"], mark: 5 },
  { id: 1013, question_ar: "أُرِيدُ شايًا ____ قَهْوَةً. (I want tea, not coffee)", question_en: "I want tea, not coffee.", correct: "لا", choices: ["وَ", "فَ", "لا", "أَوْ"], mark: 5 },
  { id: 1014, question_ar: "دَخَلَ زَيْدٌ ____ عَمْرٌو. (Zayd and Amr entered)", question_en: "Zayd and Amr entered.", correct: "وَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1015, question_ar: "دَخَلَ زَيْدٌ ____ جَلَسَ. (Zayd entered, so he sat immediately)", question_en: "Zayd entered, so he sat immediately.", correct: "فَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1016, question_ar: "دَخَلَ زَيْدٌ ____ جَلَسَ. (Zayd entered, then later he sat)", question_en: "Zayd entered, then later he sat.", correct: "ثُمَّ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1017, question_ar: "الكِتابُ ____ القَلَمُ على الطاوِلَةِ. (The book and the pen are on the table)", question_en: "The book and the pen are on the table.", correct: "وَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1018, question_ar: "ذَهَبْتُ إلى المَدْرَسَةِ ____ إلى البَيْتِ. (I went to school, then later to the house)", question_en: "I went to school, then later to the house.", correct: "ثُمَّ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1019, question_ar: "تُحِبُّ العَرَبِيَّةَ ____ الإنْجِلِيزِيَّةَ؟ (Do you like Arabic or English?)", question_en: "Do you like Arabic or English?", correct: "أَوْ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
  { id: 1020, question_ar: "دَرَسَ جَيِّدًا ____ نَجَحَ. (He studied well, so he passed - result)", question_en: "He studied well, so he passed.", correct: "فَ", choices: ["وَ", "فَ", "ثُمَّ", "أَوْ"], mark: 5 },
];


const particles = ["كم", "أين", "متى", "أي"];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const round2 = (n: number): number => Math.round(n * 100) / 100;

const i18n = {
  ar: {
    title: "تعلم العربية",
    subtitle: "منصة تعليم اللغة العربية - تصميم عثمان مرزوك",
    welcome: "مرحباً،",
    logout: "تسجيل الخروج",
    loginTitle: "تسجيل الدخول إلى \"تعلم العربية\"",
    loginDesc: "يرجى إدخال بياناتك للوصول إلى الدروس والمهام التفاعلية.",
    studentName: "اسم الطالب",
    studentEmail: "البريد الإلكتروني",
    loginBtn: "دخول",
    hubTitle: "لوحة التحكم - الدروس المتاحة",
    hubDesc: "اختر الجزء الذي ترغب في دراسته اليوم:",
    part1Title: "الجزء الثاني: التحيات العربية",
    part1Desc: "تعلم كيفية التحية والترحيب والوداع في اللغة العربية.",
    startNow: "ابدأ الآن",
    part2Title: "الجزء الثالث: أيام الأسبوع",
    part2Desc: "تعلم أسماء أيام الأسبوع في اللغة العربية وكيفية استخدامها في الجمل.",
    lessonTitle: "درس: أيام الأسبوع",
    lessonDesc: "إليك أسماء أيام الأسبوع باللغتين العربية والإنجليزية:",

    sun: "الأحد",
    mon: "الاثنين",
    tue: "الثلاثاء",
    wed: "الأربعاء",
    thu: "الخميس",
    fri: "الجمعة",
    sat: "السبت",
    yesterday: "البارحة",
    today: "اليوم",
    tomorrow: "غداً",
    startLessonQuiz: "ابدأ الاختبار",
    questTitle: "الجزء الرابع: أدوات الاستفهام",
    questDesc: "أهلاً بك في رحلة تعلم أدوات الاستفهام. لكل سؤال درجة مستقلة، والمجموع النهائي من 100. بعد الانتهاء يمكن إرسال تقرير المشاركة والدرجة مباشرة إلى المعلم.",
    startQuest: "ابدأ المهمة",

    backToHub: "العودة للرئيسية",
    leaderboard: "لوحة المتصدرين",
    question: "السؤال",
    of: "من",
    student: "الطالب",
    mark: "درجة السؤال",
    listen: "استمع للجملة",
    prev: "السؤال السابق",
    next: "السؤال التالي",
    correct: "إجابة صحيحة",
    wrong: "الإجابة الصحيحة",
    eliteBoard: "لوحة المتصدرين (Elite Board)",
    noResults: "لا توجد نتائج محفوظة بعد.",
    rank: "#",
    name: "الاسم",
    score: "النتيجة",
    date: "التاريخ",
    back: "العودة للبداية",
    certTitle: "شهادة إتمام",
    certText: "تشهد هذه الوثيقة بأن الطالب",
    certCompleted: "قد أتم بنجاح هذا الجزء من رحلة تعلم اللغة العربية",
    totalScore: "النتيجة الإجمالية",

    sendEmail: "فتح تطبيق البريد لإرسال النتيجة",
    showResults: "عرض النتائج بعد الإرسال",
    print: "طباعة الشهادة",
    replay: "إعادة اللعب",
    sendFirst: "يجب إرسال النتيجة إلى المعلم أولًا، ثم اضغط \"عرض النتائج بعد الإرسال\".",
    details: "تفاصيل الأسئلة والدرجات",
    studentAns: "إجابة الطالب",
    correctAns: "الإجابة الصحيحة",
    earned: "الدرجة",
    returnToSummary: "العودة للملخص",
    returnToQuiz: "العودة للاختبار",
    part3Title: "الجزء الرابع: أدوات الاستفهام",
    part3Desc: "Arabic Interrogative Quest - رحلة تفاعلية لتعلم أدوات الاستفهام في اللغة العربية.",
    lessonTitleGreetings: "درس: التحيات العربية",

    lessonDescGreetings: "إليك بعض التحيات الشائعة وكيفية استخدامها:",
    greet1: "السَّلَامُ عَلَيْكُم",
    greet1Desc: "التحية الإسلامية العامة (تستخدم في أي وقت).",
    greet2: "صَبَاحُ الْخَيْر",
    greet2Desc: "تستخدم في الصباح (الرد: صَبَاحُ النُّور).",
    greet3: "مَسَاءُ الْخَيْر",
    greet3Desc: "تستخدم في المساء (الرد: مَسَاءُ النُّور).",
    greet4: "مَعَ السَّلَامَة",
    greet4Desc: "تستخدم عند الوداع.",
    greet5: "كَيْفَ حَالُكَ؟",
    greet5Desc: "للسؤال عن الحال.",
    greet6: "شُكْرًا",
    greet6Desc: "للتعبير عن الامتنان.",
    part4Title: "الجزء الخامس: الأرقام العربية",
    part4Desc: "تعلم الأرقام العربية من ١ إلى ١٠ وكيفية إجراء عمليات حسابية بسيطة.",
    lessonTitleNumbers: "درس: الأرقام العربية",

    lessonDescNumbers: "إليك الأرقام العربية الأساسية وكيفية كتابتها:",
    num1: "١ - واحد",
    num2: "٢ - اثنان",
    num3: "٣ - ثلاثة",
    num4: "٤ - أربعة",
    num5: "٥ - خمسة",
    num6: "٦ - ستة",
    num7: "٧ - سبعة",
    num8: "٨ - ثمانية",
    num9: "٩ - تسعة",
    num10: "١٠ - عشرة",
    part5Title: "الجزء السادس: الضمائر العربية",
    part5Desc: "تعلم الضمائر المنفصلة في اللغة العربية وكيفية استخدامها للتعبير عن المتكلم والمخاطب والغائب.",
    lessonTitlePronouns: "درس: الضمائر العربية",

    lessonDescPronouns: "تنقسم الضمائر في العربية إلى ثلاثة أنواع رئيسية:",
    pronounType1: "١. المتكلم (First Person):",
    pronounType1Desc: "أنا (I), نحن (We)",
    pronounType2: "٢. المخاطب (Second Person):",
    pronounType2Desc: "أنتَ (You m.), أنتِ (You f.), أنتما (You two), أنتم (You pl. m.), أنتن (You pl. f.)",
    pronounType3: "٣. الغائب (Third Person):",
    pronounType3Desc: "هو (He), هي (She), هما (They two), هم (They pl. m.), هن (They pl. f.)",
    part6Title: "الجزء السابع: أسماء الإشارة",
    part6Desc: "تعلم أسماء الإشارة للقريب في اللغة العربية وكيفية استخدامها مع المفرد والمثنى والجمع.",
    lessonTitleDemo: "درس: أسماء الإشارة (للقريب)",

    lessonDescDemo: "تستخدم أسماء الإشارة للإشارة إلى الأشياء أو الأشخاص القريبين:",
    demo1: "هَذَا (This m.):",
    demo1Desc: "للمفرد المذكر (مثال: هَذَا طَالِبٌ).",
    demo2: "هَذِهِ (This f.):",
    demo2Desc: "للمفرد المؤنث (مثال: هَذِهِ طَالِبَةٌ).",
    demo3: "هَذَانِ (These two m.):",
    demo3Desc: "للمثنى المذكر (مثال: هَذَانِ كِتَابَانِ).",
    demo4: "هَاتَانِ (These two f.):",
    demo4Desc: "للمثنى المؤنث (مثال: هَاتَانِ بِنْتَانِ).",
    demo5: "هَؤُلَاءِ (These pl.):",
    demo5Desc: "للجمع (مذكر ومؤنث) للعاقل فقط.",
    part7Title: "الجزء الثامن: صفة النسبة",
    part7Desc: "تعلم كيفية صياغة صفة النسبة في اللغة العربية للإشارة إلى الأصل أو الانتماء.",
    lessonTitleNisba: "درس: صفة النسبة",

    lessonDescNisba: "تستخدم صفة النسبة للإشارة إلى الأصل أو الجنسية. إليك القواعد الأساسية:",
    nisbaRule1: "١. للمذكر:",
    nisbaRule1Desc: "أضف ياء مشددة (ـيّ) إلى نهاية الاسم (مثال: مِصْر -> مِصْرِيّ).",
    nisbaRule2: "٢. للمؤنث:",
    nisbaRule2Desc: "أضف ياء مشددة وتاء مربوطة (ـيّة) إلى نهاية الاسم (مثال: مِصْر -> مِصْرِيَّة).",
    nisbaRule3: "٣. الحذف:",
    nisbaRule3Desc: "احذف (الـ) التعريف، والتاء المربوطة (ـة)، والألف النهائية (ـا/ـيا) قبل إضافة الياء.",
    partLettersTitle: "الجزء الأول: الحروف العربية",
    partLettersDesc: "تعرف على أشكال الحروف العربية وكيفية اتصالها ببعضها البعض لتكوين الكلمات.",
    part8Title: "الجزء التاسع: عبارات شائعة",
    part8Desc: "تعلم العبارات الأساسية، التحيات، عبارات العمل، السفر، والطعام في اللغة العربية.",
    lessonTitlePhrases: "درس: عبارات عربية شائعة",
    lessonDescPhrases: "إليك مجموعة من العبارات العربية الأساسية مع النطق والترجمة:",
    phrasesBasic: "عبارات أساسية",
    phrasesGreetings: "تحيات شائعة",
    phrasesFormal: "خطاب رسمي",
    phrasesWork: "عبارات مكان العمل",
    phrasesTravel: "عبارات السفر",
    phrasesFood: "عبارات الطعام",
    phrasesLove: "عبارات الحب",
    lessonTitleLetters: "درس: أشكال الحروف العربية",
    lessonDescLetters: "اللغة العربية لغة متصلة (Cursive)، حيث تتغير أشكال الحروف حسب موقعها في الكلمة:",
    lettersSummary: "هناك ٦ حروف تسمى \"الحروف غير المتصلة\" (أ، د، ذ، ر، ز، و)، وهي تتصل بما قبلها فقط ولا تتصل بما بعدها.",
    letterFormIsolated: "منفصل",
    letterFormInitial: "بداية",
    letterFormMedial: "وسط",
    letterFormFinal: "نهاية",
    footer: "تعلم العربية — تصميم عثمان مرزوك",
    skipBtn: "تخطي السؤال",
    skipInfo: "يمكنك تخطي هذا السؤال والحصول على درجته كاملة لأنك أجبت على 5 أسئلة متتالية بشكل صحيح!",
    deactivateInfo: "إخفاء هذه المعلومة مستقبلاً",
    lockedBtn: "الرجاء مراجعة الدرس (متاح بعد {n} ثانية)",
    readAgain: "اقرأ النص مرة أخرى بعناية",
    briefSummaryTitle: "ملخص سريع",
    audioError: "خطأ في الصوت",
    writtenTaskTitle: "المهمة الكتابية",
    writtenTaskDesc: "يرجى كتابة نص قصير باللغة العربية بناءً على ما تعلمته في هذا الجزء.",
    submitTask: "إرسال المهمة",
    peerReviewTitle: "تقييم الزملاء",
    peerReviewDesc: "يرجى تقييم عمل زميلك بناءً على المعايير التالية:",
    rubric1: "الدقة اللغوية (Grammar and Language Accuracy)",
    rubric2: "المفردات واستخدامها (Vocabulary Use)",
    rubric3: "وضوح المعنى وتنظيم الفكرة (Clarity and Organization)",
    rubric4: "الطلاقة والتعبير (Fluency and Expression)",
    rubric5: "الالتزام بالمهمة (Task Completion)",
    explainWhy: "يرجى توضيح سبب عدم إعطاء درجة كاملة:",
    submitReview: "إرسال التقييم",
    waitingForReview: "بانتظار تقييم عملك من قبل أحد الزملاء...",
    needToReview: "يجب عليك تقييم عمل أحد الزملاء لإكمال هذا الجزء.",
    noTasksToReview: "لا يوجد مهام حالياً لتقييمها. يرجى المحاولة لاحقاً.",
    reviewCompleted: "تم إكمال التقييم بنجاح!",
    correctionCriteria: "معايير التصحيح",
    grammarDesc: "مدى صحة القواعد النحوية واستخدام الحروف بشكل صحيح.",
    vocabDesc: "استخدام الكلمات والمفردات المناسبة للموضوع.",
    clarityDesc: "وضوح الأفكار وتسلسلها بشكل منطقي.",
    fluencyDesc: "سلاسة التعبير والقدرة على إيصال المعنى.",
    completionDesc: "مدى تغطية جميع عناصر المهمة المطلوبة.",
    taskPromptLetters: "اكتب ثلاث كلمات عربية تعرفها ووضح الحروف المكونة لها.",
    taskPromptGreetings: "اكتب حواراً قصيراً بين شخصين يستخدمان التحيات التي تعلمتها.",
    taskPromptDays: "اكتب فقرة قصيرة تصف فيها جدولك الأسبوعي باستخدام أيام الأسبوع.",
    taskPromptQuest: "اكتب خمسة أسئلة باستخدام أدوات الاستفهام المختلفة التي تعلمتها.",
    taskPromptNumbers: "اكتب فقرة قصيرة تتضمن أرقاماً عربية (مثلاً: عمري، عدد إخوتي، إلخ).",
    taskPromptPronouns: "اكتب جملتين عن نفسك وجملتين عن صديقك باستخدام الضمائر المناسبة.",
    taskPromptDemo: "صف الأشياء الموجودة في غرفتك باستخدام أسماء الإشارة للقريب.",
    taskPromptNisba: "اكتب عن جنسيتك وجنسية ثلاثة من أصدقائك باستخدام صفة النسبة.",
    taskPromptPhrases: "اكتب فقرة قصيرة تستخدم فيها خمس عبارات شائعة تعلمتها في هذا الدرس.",
    part9Title: "الجزء العاشر: حروف الجر",
    part9Desc: "تعلم حروف الجر في اللغة العربية وكيفية استخدامها لربط الكلمات وتحديد العلاقات المكانية والزمانية.",
    lessonTitlePrepositions: "درس: حروف الجر",
    lessonDescPrepositions: "حروف الجر تربط الأسماء بغيرها من الكلمات وتجر الاسم الذي يليها (الاسم المجرور).",
    taskPromptPrepositions: "اكتب خمس جمل تحتوي على حروف جر مختلفة مما تعلمته في هذا الدرس.",
    part10Title: "الجزء الحادي عشر: حروف العطف",
    part10Desc: "تعلم حروف العطف في اللغة العربية وكيفية استخدامها لربط الكلمات والجمل.",
    lessonTitleConjunctions: "درس: حروف العطف",
    lessonDescConjunctions: "حروف العطف هي كلمات تستخدم للربط بين الكلمات أو الجمل.",
    taskPromptConjunctions: "اكتب خمس جمل تستخدم فيها حروف عطف مختلفة مما تعلمته في هذا الدرس.",
    part11Title: "الجزء الثاني عشر: قراءة ألف ليلة وليلة",
    part11Desc: "رحلة قراءة تفاعلية عبر قصص ألف ليلة وليلة مع مراجعة شاملة لجميع الأجزاء السابقة.",
    readingNight: "الليلة",
    readingStory: "القصة",
    readingQuestions: "أسئلة المراجعة",
    readingNextNight: "الليلة التالية",
    readingFinish: "إنهاء الرحلة",
  },

  en: {
    title: "Learn Arabic",
    subtitle: "Arabic Learning Platform - Designed by Othman Marzoog",
    welcome: "Welcome,",
    logout: "Logout",
    loginTitle: "Login to \"Learn Arabic\"",
    loginDesc: "Please enter your details to access lessons and interactive tasks.",
    studentName: "Student Name",
    studentEmail: "Email Address",
    loginBtn: "Login",
    hubTitle: "Dashboard - Available Lessons",
    hubDesc: "Choose the part you want to study today:",
    part1Title: "Part 2: Arabic Greetings",
    part1Desc: "Learn how to greet, welcome, and say goodbye in Arabic.",
    startNow: "Start Now",
    part2Title: "Part 3: Days of the Week",
    part2Desc: "Learn the names of the days of the week in Arabic and how to use them in sentences.",
    part3Title: "Part 4: Interrogative Particles",
    part3Desc: "Arabic Interrogative Quest - An interactive journey to learn interrogative particles in Arabic.",
    part4Title: "Part 5: Arabic Numbers",
    part4Desc: "Learn Arabic numbers from 1 to 10 and how to perform simple calculations.",
    part5Title: "Part 6: Arabic Pronouns",
    part5Desc: "Learn independent pronouns in Arabic and how to use them for first, second, and third person.",
    part6Title: "Part 7: Demonstrative Pronouns",
    part6Desc: "Learn demonstrative pronouns for near objects in Arabic and how to use them with singular, dual, and plural.",
    part7Title: "Part 8: Nisba Adjective",
    part7Desc: "Learn how to form Nisba adjectives in Arabic to indicate origin or belonging.",
    partLettersTitle: "Part 1: Arabic Letters",

    partLettersDesc: "Learn about Arabic letter forms and how they connect to form words.",
    part8Title: "Part 9: Common Phrases",
    part8Desc: "Learn basic phrases, greetings, workplace expressions, travel, and food in Arabic.",
    lessonTitlePhrases: "Lesson: Common Arabic Phrases",
    lessonDescPhrases: "Here is a collection of essential Arabic phrases with transliteration and translation:",
    phrasesBasic: "Basic Phrases",
    phrasesGreetings: "Common Greetings",
    phrasesFormal: "Formal Speech",
    phrasesWork: "Workplace Phrases",
    phrasesTravel: "Travel Phrases",
    phrasesFood: "Food Phrases",
    phrasesLove: "Love Phrases",
    lessonTitleLetters: "Lesson: Arabic Letter Forms",
    lessonDescLetters: "Arabic is a cursive language where most letters connect. Letter shapes change based on their position:",
    lettersSummary: "Six letters are 'non-connectors' (Alif, Dāl, Dhāl, Rā’, Zāy, Wāw). They only connect to the letter before them.",
    letterFormIsolated: "Isolated",
    letterFormInitial: "Initial",
    letterFormMedial: "Medial",
    letterFormFinal: "Final",
    lessonTitleNisba: "Lesson: Nisba Adjective",

    lessonDescNisba: "Nisba adjectives are used to indicate origin or nationality. Here are the basic rules:",
    nisbaRule1: "1. For Masculine:",
    nisbaRule1Desc: "Add a stressed Yaa (ـيّ) to the end of the noun (e.g., Egypt -> Egyptian m.).",
    nisbaRule2: "2. For Feminine:",
    nisbaRule2Desc: "Add a stressed Yaa and Taa Marbuuta (ـيّة) to the end (e.g., Egypt -> Egyptian f.).",
    nisbaRule3: "3. Deletions:",
    nisbaRule3Desc: "Remove 'Al-', final 'ـة', and final 'ـا/ـيا' before adding the suffix.",
    lessonTitleDemo: "Lesson: Demonstrative Pronouns (Near)",
    lessonDescDemo: "Demonstrative pronouns are used to point to nearby objects or people:",
    demo1: "Hadha (This m.):",
    demo1Desc: "For singular masculine (e.g., This is a student).",
    demo2: "Hadhihi (This f.):",
    demo2Desc: "For singular feminine (e.g., This is a female student).",
    demo3: "Hadhan (These two m.):",
    demo3Desc: "For dual masculine (e.g., These are two books).",
    demo4: "Hatan (These two f.):",
    demo4Desc: "For dual feminine (e.g., These are two girls).",
    demo5: "Ha'ula'i (These pl.):",
    demo5Desc: "For plural (masculine and feminine) for people only.",
    lessonTitlePronouns: "Lesson: Arabic Pronouns",
    lessonDescPronouns: "Arabic pronouns are divided into three main categories:",
    pronounType1: "1. First Person (Al-Mutakallim):",
    pronounType1Desc: "Ana (I), Nahnu (We)",
    pronounType2: "2. Second Person (Al-Mukhatab):",
    pronounType2Desc: "Anta (You m.), Anti (You f.), Antuma (You two), Antum (You pl. m.), Antunna (You pl. f.)",
    pronounType3: "3. Third Person (Al-Gha'ib):",
    pronounType3Desc: "Huwa (He), Hiya (She), Huma (They two), Hum (They pl. m.), Hunna (They pl. f.)",
    lessonTitleNumbers: "Lesson: Arabic Numbers",
    lessonDescNumbers: "Here are the basic Arabic numbers and how to write them:",
    num1: "1 - Wahid",
    num2: "2 - Ithnan",
    num3: "3 - Thalatha",
    num4: "4 - Arba'a",
    num5: "5 - Khamsa",
    num6: "6 - Sitta",
    num7: "7 - Sab'a",
    num8: "8 - Thamania",
    num9: "9 - Tis'a",
    num10: "10 - 'Ashara",
    lessonTitleGreetings: "Lesson: Arabic Greetings",
    lessonDescGreetings: "Here are some common greetings and when to use them:",
    greet1: "Assalamu Alaikum",
    greet1Desc: "General Islamic greeting (used anytime).",
    greet2: "Sabah al-Khair",
    greet2Desc: "Used in the morning (Response: Sabah al-Noor).",
    greet3: "Masa' al-Khair",
    greet3Desc: "Used in the evening (Response: Masa' al-Noor).",
    greet4: "Ma'a Salama",
    greet4Desc: "Used when saying goodbye.",
    greet5: "Kaifa Haluka?",
    greet5Desc: "To ask 'How are you?'.",
    greet6: "Shukran",
    greet6Desc: "To express gratitude.",
    lessonTitle: "Lesson: Days of the Week",
    lessonDesc: "Here are the names of the days of the week in Arabic and English:",
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    yesterday: "Yesterday",
    today: "Today",
    tomorrow: "Tomorrow",
    startLessonQuiz: "Start Quiz",
    questTitle: "Part 4: Interrogative Particles",
    questDesc: "Welcome to the Interrogative Quest. Each question has its own mark, and the total score is out of 100. Upon completion, you can send the participation report and score directly to the teacher.",
    startQuest: "Start Quest",

    backToHub: "Back to Home",
    leaderboard: "Leaderboard",
    question: "Question",
    of: "of",
    student: "Student",
    mark: "Question Mark",
    listen: "Listen to Sentence",
    prev: "Previous Question",
    next: "Next Question",
    correct: "Correct Answer",
    wrong: "Correct Answer",
    eliteBoard: "Elite Board",
    noResults: "No saved results yet.",
    rank: "#",
    name: "Name",
    score: "Score",
    date: "Date",
    back: "Back to Start",
    certTitle: "Certificate of Completion",
    certText: "This certifies that",
    certCompleted: "has successfully completed this part of the Arabic learning journey",
    totalScore: "Total Score",

    sendEmail: "Open Email App to Send Result",
    showResults: "Show Results After Sending",
    print: "Print Certificate",
    replay: "Replay",
    sendFirst: "You must send the result to the teacher first, then click \"Show Results After Sending\".",
    details: "Question & Mark Details",
    studentAns: "Student Answer",
    correctAns: "Correct Answer",
    earned: "Mark",
    returnToSummary: "Return to Summary",
    returnToQuiz: "Return to Quiz",
    footer: "Learn Arabic — Designed by Othman Marzoog",
    skipBtn: "Skip Question",
    skipInfo: "You can skip this question and get full marks because you answered 5 questions correctly in a row!",
    deactivateInfo: "Don't show this info again",
    lockedBtn: "Please review the lesson (Available in {n}s)",
    readAgain: "Read the text again carefully",
    briefSummaryTitle: "Brief Summary",
    audioError: "Audio Error",
    writtenTaskTitle: "Written Task",
    writtenTaskDesc: "Please write a short text in Arabic based on what you learned in this part.",
    submitTask: "Submit Task",
    peerReviewTitle: "Peer Review",
    peerReviewDesc: "Please evaluate your peer's work based on the following criteria:",
    rubric1: "Grammar and Language Accuracy",
    rubric2: "Vocabulary Use",
    rubric3: "Clarity and Organization",
    rubric4: "Fluency and Expression",
    rubric5: "Task Completion",
    explainWhy: "Please explain why you didn't give a full mark:",
    submitReview: "Submit Review",
    waitingForReview: "Waiting for your work to be reviewed by a peer...",
    needToReview: "You must review a peer's work to complete this part.",
    noTasksToReview: "No tasks currently available for review. Please try again later.",
    reviewCompleted: "Review completed successfully!",
    correctionCriteria: "Correction Criteria",
    grammarDesc: "Accuracy of grammar and correct use of letters.",
    vocabDesc: "Use of appropriate words and vocabulary for the topic.",
    clarityDesc: "Clarity of ideas and logical sequence.",
    fluencyDesc: "Smoothness of expression and ability to convey meaning.",
    completionDesc: "Extent to which all required task elements are covered.",
    taskPromptLetters: "Write three Arabic words you know and explain the letters that form them.",
    taskPromptGreetings: "Write a short dialogue between two people using the greetings you learned.",
    taskPromptDays: "Write a short paragraph describing your weekly schedule using the days of the week.",
    taskPromptQuest: "Write five questions using the different interrogative particles you learned.",
    taskPromptNumbers: "Write a short paragraph that includes Arabic numbers (e.g., my age, number of siblings, etc.).",
    taskPromptPronouns: "Write two sentences about yourself and two sentences about your friend using the appropriate pronouns.",
    taskPromptDemo: "Describe the objects in your room using demonstrative pronouns for near objects.",
    taskPromptNisba: "Write about your nationality and the nationality of three of your friends using the Nisba adjective.",
    taskPromptPhrases: "Write a short paragraph using five common phrases you learned in this lesson.",
    part9Title: "Part 10: Arabic Prepositions",
    part9Desc: "Learn Arabic prepositions and how to use them to link words and define spatial and temporal relations.",
    lessonTitlePrepositions: "Lesson: Arabic Prepositions",
    lessonDescPrepositions: "Prepositions link nouns to other words and make the following noun genitive (Majrūr).",
    taskPromptPrepositions: "Write five sentences containing different prepositions you learned in this lesson.",
    part10Title: "Part 11: Arabic Conjunctions",
    part10Desc: "Learn Arabic conjunctions and how to use them to join words and sentences.",
    lessonTitleConjunctions: "Lesson: Arabic Conjunctions",
    lessonDescConjunctions: "Conjunctions are words used to join two words, two phrases, or two sentences together.",
    taskPromptConjunctions: "Write five sentences using different conjunctions you learned in this lesson.",
    part11Title: "Part 12: Reading One Thousand and One Nights",
    part11Desc: "An interactive reading journey through the stories of One Thousand and One Nights with a comprehensive review of all previous parts.",
    readingNight: "Night",
    readingStory: "Story",
    readingQuestions: "Review Questions",
    readingNextNight: "Next Night",
    readingFinish: "Finish Journey",
  },
  es: {
    title: "Aprender Árabe",
    subtitle: "Plataforma de Aprendizaje de Árabe - Diseñada por Othman Marzoog",
    welcome: "Bienvenido,",
    logout: "Cerrar sesión",
    loginTitle: "Iniciar sesión en \"Aprender Árabe\"",
    loginDesc: "Por favor, ingrese sus datos para acceder a las lecciones y tareas interactivas.",
    studentName: "Nombre del Estudiante",
    studentEmail: "Dirección de Correo Electrónico",
    loginBtn: "Iniciar Sesión",
    hubTitle: "Panel de Control - Lecciones Disponibles",
    hubDesc: "Elija la parte que desea estudiar hoy:",
    part1Title: "Parte 2: Saludos Árabes",
    part1Desc: "Aprenda a saludar, dar la bienvenida y despedirse en árabe.",
    startNow: "Empezar Ahora",
    part2Title: "Parte 3: Días de la Semana",
    part2Desc: "Aprenda los nombres de los días de la semana en árabe y cómo usarlos en oraciones.",
    part3Title: "Parte 4: Partículas Interrogativas",
    part3Desc: "Búsqueda Interrogativa Árabe - Un viaje interactivo para aprender partículas interrogativas en árabe.",
    part4Title: "Parte 5: Números Árabes",
    part4Desc: "Aprenda los números árabes del 1 al 10 y cómo realizar cálculos simples.",
    part5Title: "Parte 6: Pronombres Árabes",
    part5Desc: "Aprenda los pronombres independientes en árabe y cómo usarlos para la primera, segunda y tercera persona.",
    part6Title: "Parte 7: Pronombres Demostrativos",
    part6Desc: "Aprenda los pronombres demostrativos para objetos cercanos en árabe y cómo usarlos con singular, dual y plural.",
    part7Title: "Parte 8: Adjetivo Nisba",
    part7Desc: "Aprenda a formar adjetivos Nisba en árabe para indicar origen o pertenencia.",
    partLettersTitle: "Parte 1: Letras Árabas",
    partLettersDesc: "Aprenda sobre las formas de las letras árabas y cómo se conectan para formar palabras.",
    part8Title: "Parte 9: Frases Comunes",
    part8Desc: "Aprenda frases básicas, saludos, expresiones en el lugar de trabajo, viajes y comida en árabe.",
    lessonTitlePhrases: "Lección: Frases Árabes Comunes",
    lessonDescPhrases: "Aquí hay una colección de frases árabes esenciales con transliteración y traducción:",
    phrasesBasic: "Frases Básicas",
    phrasesGreetings: "Saludos Comunes",
    phrasesFormal: "Discurso Formal",
    phrasesWork: "Frases en el Trabajo",
    phrasesTravel: "Frases de Viaje",
    phrasesFood: "Frases de Comida",
    phrasesLove: "Frases de Amor",
    lessonTitleLetters: "Lección: Formas de las Letras Árabas",
    lessonDescLetters: "El árabe es un idioma cursivo donde la mayoría de las letras se conectan. Las formas de las letras cambian según su posición:",
    lettersSummary: "Seis letras son 'no conectoras' (Alif, Dāl, Dhāl, Rā’, Zāy, Wāw). Solo se conectan con la letra anterior.",
    letterFormIsolated: "Aislada",
    letterFormInitial: "Inicial",
    letterFormMedial: "Media",
    letterFormFinal: "Final",
    lessonTitleNisba: "Lección: Adjetivo Nisba",
    lessonDescNisba: "Los adjetivos Nisba se usan para indicar origen o nacionalidad. Aquí están las reglas básicas:",
    nisbaRule1: "1. Para Masculino:",
    nisbaRule1Desc: "Añada una Yaa acentuada (ـيّ) al final del sustantivo (ej., Egipto -> Egipcio m.).",
    nisbaRule2: "2. Para Femenino:",
    nisbaRule2Desc: "Añada una Yaa acentuada y Taa Marbuuta (ـيّة) al final (ej., Egipto -> Egipcia f.).",
    nisbaRule3: "3. Eliminaciones:",
    nisbaRule3Desc: "Elimine 'Al-', la 'ـة' final y la 'ـا/ـيا' final antes de añadir el sufijo.",
    lessonTitleDemo: "Lección: Pronombres Demostrativos (Cercanos)",
    lessonDescDemo: "Los pronombres demostrativos se usan para señalar objetos o personas cercanas:",
    demo1: "Hadha (Este m.):",
    demo1Desc: "Para masculino singular (ej., Este es un estudiante).",
    demo2: "Hadhihi (Esta f.):",
    demo2Desc: "Para femenino singular (ej., Esta es una estudiante).",
    demo3: "Hadhan (Estos dos m.):",
    demo3Desc: "Para masculino dual (ej., Estos son dos libros).",
    demo4: "Hatan (Estas dos f.):",
    demo4Desc: "Para femenino dual (ej., Estas son dos niñas).",
    demo5: "Ha'ula'i (Estos pl.):",
    demo5Desc: "Para plural (masculino y femenino) solo para personas.",
    lessonTitlePronouns: "Lección: Pronombres Árabes",
    lessonDescPronouns: "Los pronombres árabes se dividen en tres categorías principales:",
    pronounType1: "1. Primera Persona (Al-Mutakallim):",
    pronounType1Desc: "Ana (Yo), Nahnu (Nosotros)",
    pronounType2: "2. Segunda Persona (Al-Mukhatab):",
    pronounType2Desc: "Anta (Tú m.), Anti (Tú f.), Antuma (Ustedes dos), Antum (Ustedes pl. m.), Antunna (Ustedes pl. f.)",
    pronounType3: "3. Tercera Persona (Al-Gha'ib):",
    pronounType3Desc: "Huwa (Él), Hiya (Ella), Huma (Ellos dos), Hum (Ellos pl. m.), Hunna (Ellas pl. f.)",
    lessonTitleNumbers: "Lección: Números Árabes",
    lessonDescNumbers: "Aquí están los números árabes básicos y cómo escribirlos:",
    num1: "1 - Wahid",
    num2: "2 - Ithnan",
    num3: "3 - Thalatha",
    num4: "4 - Arba'a",
    num5: "5 - Khamsa",
    num6: "6 - Sitta",
    num7: "7 - Sab'a",
    num8: "8 - Thamania",
    num9: "9 - Tis'a",
    num10: "10 - 'Ashara",
    lessonTitleGreetings: "Lección: Saludos Árabes",
    lessonDescGreetings: "Aquí hay algunos saludos comunes y cuándo usarlos:",
    greet1: "Assalamu Alaikum",
    greet1Desc: "Saludo islámico general (usado en cualquier momento).",
    greet2: "Sabah al-Khair",
    greet2Desc: "Usado por la mañana (Respuesta: Sabah al-Noor).",
    greet3: "Masa' al-Khair",
    greet3Desc: "Usado por la tarde/noche (Respuesta: Masa' al-Noor).",
    greet4: "Ma'a Salama",
    greet4Desc: "Usado al despedirse.",
    greet5: "Kaifa Haluka?",
    greet5Desc: "Para preguntar '¿Cómo estás?'.",
    greet6: "Shukran",
    greet6Desc: "Para expresar gratitud.",
    lessonTitle: "Lección: Días de la Semana",
    lessonDesc: "Aquí están los nombres de los días de la semana en árabe e inglés:",
    sun: "Domingo",
    mon: "Lunes",
    tue: "Martes",
    wed: "Miércoles",
    thu: "Jueves",
    fri: "Viernes",
    sat: "Sábado",
    yesterday: "Ayer",
    today: "Hoy",
    tomorrow: "Mañana",
    startLessonQuiz: "Empezar Cuestionario",
    questTitle: "Parte 4: Partículas Interrogativas",
    questDesc: "Bienvenido a la Búsqueda Interrogativa. Cada pregunta tiene su propia marca, y la puntuación total es sobre 100. Al finalizar, puede enviar el informe de participación y la puntuación directamente al profesor.",
    startQuest: "Empezar Búsqueda",
    backToHub: "Volver al Inicio",
    leaderboard: "Tabla de Clasificación",
    question: "Pregunta",
    of: "de",
    student: "Estudiante",
    mark: "Marca de Pregunta",
    listen: "Escuchar Oración",
    prev: "Pregunta Anterior",
    next: "Siguiente Pregunta",
    correct: "Respuesta Correcta",
    wrong: "Respuesta Correcta",
    eliteBoard: "Tablero Élite",
    noResults: "Aún no hay resultados guardados.",
    rank: "#",
    name: "Nombre",
    score: "Puntuación",
    date: "Fecha",
    back: "Volver al Inicio",
    certTitle: "Certificado de Finalización",
    certText: "Esto certifica que",
    certCompleted: "ha completado con éxito esta parte del viaje de aprendizaje de árabe",
    totalScore: "Puntuación Total",
    sendEmail: "Abrir Correo para Enviar Resultado",
    showResults: "Mostrar Resultados Después de Enviar",
    print: "Imprimir Certificado",
    replay: "Volver a Jugar",
    sendFirst: "Debe enviar el resultado al profesor primero, luego haga clic en \"Mostrar Resultados Después de Enviar\".",
    details: "Detalles de Preguntas y Marcas",
    studentAns: "Respuesta del Estudiante",
    correctAns: "Respuesta Correcta",
    earned: "Marca",
    returnToSummary: "Volver al Resumen",
    returnToQuiz: "Volver al Cuestionario",
    footer: "Aprender Árabe — Diseñado por Othman Marzoog",
    skipBtn: "Saltar Pregunta",
    skipInfo: "¡Puedes saltar esta pregunta y obtener la puntuación completa porque respondiste 5 preguntas correctamente seguidas!",
    deactivateInfo: "No volver a mostrar esta información",
    lockedBtn: "Por favor revise la lección (Disponible en {n}s)",
    readAgain: "Lea el texto nuevamente con cuidado",
    briefSummaryTitle: "Resumen Breve",
    audioError: "Error de Audio",
    writtenTaskTitle: "Tarea Escrita",
    writtenTaskDesc: "Por favor, escribe un breve texto en árabe basado en lo que aprendiste en esta parte.",
    submitTask: "Enviar Tarea",
    peerReviewTitle: "Revisión por Pares",
    peerReviewDesc: "Por favor, evalúa el trabajo de tu compañero según los siguientes criterios:",
    rubric1: "Precisión Lingüística (Grammar and Language Accuracy)",
    rubric2: "Uso de Vocabulario (Vocabulary Use)",
    rubric3: "Claridad y Organización (Clarity and Organization)",
    rubric4: "Fluidez y Expresión (Fluency and Expression)",
    rubric5: "Cumplimiento de la Tarea (Task Completion)",
    explainWhy: "Por favor, explica por qué no diste la nota máxima:",
    submitReview: "Enviar Revisión",
    waitingForReview: "Esperando a que tu trabajo sea revisado por un compañero...",
    needToReview: "Debes revisar el trabajo de un compañero para completar esta parte.",
    noTasksToReview: "No hay tareas disponibles para revisar actualmente. Por favor, inténtalo de nuevo más tarde.",
    reviewCompleted: "¡Revisión completada con éxito!",
    taskPromptLetters: "Escribe tres palabras en árabe que conozcas y explica las letras que las forman.",
    taskPromptGreetings: "Escribe un diálogo corto entre dos personas usando los saludos que aprendiste.",
    taskPromptDays: "Escribe un párrafo corto describiendo tu horario semanal usando los días de la semana.",
    taskPromptQuest: "Escribe cinco preguntas usando las diferentes partículas interrogativas que aprendiste.",
    taskPromptNumbers: "Escribe un párrafo corto que incluya números en árabe (ej. mi edad, número de hermanos, etc.).",
    taskPromptPronouns: "Escribe dos oraciones sobre ti y dos sobre tu amigo usando los pronombres adecuados.",
    taskPromptDemo: "Describe los objetos en tu habitación usando pronombres demostrativos para objetos cercanos.",
    taskPromptNisba: "Escribe sobre tu nacionalidad y la de tres de tus amigos usando el adjetivo Nisba.",
    taskPromptPhrases: "Escribe un párrafo corto usando cinco frases comunes que aprendiste en esta lección.",
    part9Title: "Parte 10: Preposiciones Árabes",
    part9Desc: "Aprenda las preposiciones árabes y cómo usarlas para vincular palabras y definir relaciones espaciales y temporales.",
    lessonTitlePrepositions: "Lección: Preposiciones Árabes",
    lessonDescPrepositions: "Las preposiciones vinculan sustantivos con otras palabras y hacen que el sustantivo siguiente sea genitivo (Majrūr).",
    taskPromptPrepositions: "Escriba cinco oraciones que contengan diferentes preposiciones que aprendió en esta lección.",
    part10Title: "Parte 11: Conjunciones Árabes",
    part10Desc: "Aprenda las conjunciones árabes y cómo usarlas para unir palabras y oraciones.",
    lessonTitleConjunctions: "Lección: Conjunciones Árabes",
    lessonDescConjunctions: "Las conjunciones son palabras que se usan para unir dos palabras, dos frases o dos oraciones.",
    taskPromptConjunctions: "Escriba cinco oraciones usando diferentes conjunciones que aprendió en esta lección.",
    part11Title: "Parte 12: Lectura de Las mil y una noches",
    part11Desc: "Un viaje de lectura interactivo a través de las historias de Las mil y una noches con un repaso exhaustivo de todas las partes anteriores.",
    readingNight: "Noche",
    readingStory: "Historia",
    readingQuestions: "Preguntas de Repaso",
    readingNextNight: "Siguiente Noche",
    readingFinish: "Finalizar Viaje",
  },
  zh: {
    title: "学习阿拉伯语",
    subtitle: "阿拉伯语学习平台 - 由 Othman Marzoog 设计",
    welcome: "欢迎，",
    logout: "登出",
    loginTitle: "登录“学习阿拉伯语”",
    loginDesc: "请输入您的详细信息以访问课程和互动任务。",
    studentName: "学生姓名",
    studentEmail: "电子邮件地址",
    loginBtn: "登录",
    hubTitle: "仪表板 - 可用课程",
    hubDesc: "选择您今天想学习的部分：",
    part1Title: "第 2 部分：阿拉伯语问候语",
    part1Desc: "学习如何在阿拉伯语中问候、欢迎和告别。",
    startNow: "现在开始",
    part2Title: "第 3 部分：一周中的日子",
    part2Desc: "学习阿拉伯语中一周中日子的名称以及如何在句子中使用它们。",
    part3Title: "第 4 部分：疑问词",
    part3Desc: "阿拉伯语疑问词探索 - 学习阿拉伯语疑问词的互动之旅。",
    part4Title: "第 5 部分：阿拉伯数字",
    part4Desc: "学习 1 到 10 的阿拉伯数字以及如何进行简单的计算。",
    part5Title: "第 6 部分：阿拉伯语代词",
    part5Desc: "学习阿拉伯语中的独立代词以及如何使用它们来表示第一、第二和第三人称。",
    part6Title: "第 7 部分：指示代词",
    part6Desc: "学习阿拉伯语中近指代词以及如何与单数、双数和复数一起使用。",
    part7Title: "第 8 部分：Nisba 形容词",
    part7Desc: "学习如何在阿拉伯语中构成 Nisba 形容词以表示来源或归属。",
    partLettersTitle: "第 1 部分：阿拉伯字母",
    partLettersDesc: "了解阿拉伯字母的形式以及它们如何连接形成单词。",
    part8Title: "第 9 部分：常用短语",
    part8Desc: "学习阿拉伯语中的基本短语、问候语、职场表达、旅行和食物。",
    lessonTitlePhrases: "课程：常用阿拉伯语短语",
    lessonDescPhrases: "这里精选了一些基本的阿拉伯语短语，配有音译和翻译：",
    phrasesBasic: "基本短语",
    phrasesGreetings: "常用问候语",
    phrasesFormal: "正式用语",
    phrasesWork: "职场短语",
    phrasesTravel: "旅行短语",
    phrasesFood: "食物短语",
    phrasesLove: "爱情短语",
    lessonTitleLetters: "课程：阿拉伯字母形式",
    lessonDescLetters: "阿拉伯语是一种草书语言，大多数字母都会连接。字母形状根据其位置而变化：",
    lettersSummary: "有六个字母是“非连接字母”（Alif, Dāl, Dhāl, Rā’, Zāy, Wāw）。它们只与前面的字母连接。",
    letterFormIsolated: "独立",
    letterFormInitial: "词首",
    letterFormMedial: "词中",
    letterFormFinal: "词尾",
    lessonTitleNisba: "课程：Nisba 形容词",
    lessonDescNisba: "Nisba 形容词用于表示来源或国籍。以下是基本规则：",
    nisbaRule1: "1. 阳性：",
    nisbaRule1Desc: "在名词末尾添加重读 Yaa (ـيّ)（例如，埃及 -> 埃及人 m.）。",
    nisbaRule2: "2. 阴性：",
    nisbaRule2Desc: "在末尾添加重读 Yaa 和 Taa Marbuuta (ـيّة)（例如，埃及 -> 埃及人 f.）。",
    nisbaRule3: "3. 删除：",
    nisbaRule3Desc: "在添加后缀之前删除 'Al-'、词尾的 'ـة' 和词尾的 'ـا/ـيا'。",
    lessonTitleDemo: "课程：指示代词（近指）",
    lessonDescDemo: "指示代词用于指向附近的物体或人：",
    demo1: "Hadha (这个 m.):",
    demo1Desc: "用于单数阳性（例如，这是一名学生）。",
    demo2: "Hadhihi (这个 f.):",
    demo2Desc: "用于单数阴性（例如，这是一名女学生）。",
    demo3: "Hadhan (这两个 m.):",
    demo3Desc: "用于双数阳性（例如，这是两本书）。",
    demo4: "Hatan (这两个 f.):",
    demo4Desc: "用于双数阴性（例如，这是两个女孩）。",
    demo5: "Ha'ula'i (这些 pl.):",
    demo5Desc: "用于复数（阳性和阴性），仅限人。",
    lessonTitlePronouns: "课程：阿拉伯语代词",
    lessonDescPronouns: "阿拉伯语代词分为三大类：",
    pronounType1: "1. 第一人称 (Al-Mutakallim):",
    pronounType1Desc: "Ana (我), Nahnu (我们)",
    pronounType2: "2. 第二人称 (Al-Mukhatab):",
    pronounType2Desc: "Anta (你 m.), Anti (你 f.), Antuma (你们两个), Antum (你们 pl. m.), Antunna (你们 pl. f.)",
    pronounType3: "3. 第三人称 (Al-Gha'ib):",
    pronounType3Desc: "Huwa (他), Hiya (她), Huma (他们两个), Hum (他们 pl. m.), Hunna (她们 pl. f.)",
    lessonTitleNumbers: "课程：阿拉伯数字",
    lessonDescNumbers: "以下是基本的阿拉伯数字及其写法：",
    num1: "1 - Wahid",
    num2: "2 - Ithnan",
    num3: "3 - Thalatha",
    num4: "4 - Arba'a",
    num5: "5 - Khamsa",
    num6: "6 - Sitta",
    num7: "7 - Sab'a",
    num8: "8 - Thamania",
    num9: "9 - Tis'a",
    num10: "10 - 'Ashara",
    lessonTitleGreetings: "课程：阿拉伯语问候语",
    lessonDescGreetings: "以下是一些常见的问候语及其使用时机：",
    greet1: "Assalamu Alaikum",
    greet1Desc: "通用伊斯兰问候语（随时可用）。",
    greet2: "Sabah al-Khair",
    greet2Desc: "早晨使用（回答：Sabah al-Noor）。",
    greet3: "Masa' al-Khair",
    greet3Desc: "晚上使用（回答：Masa' al-Noor）。",
    greet4: "Ma'a Salama",
    greet4Desc: "告别时使用。",
    greet5: "Kaifa Haluka?",
    greet5Desc: "询问“你好吗？”。",
    greet6: "Shukran",
    greet6Desc: "表达感谢。",
    lessonTitle: "课程：一周中的日子",
    lessonDesc: "以下是阿拉伯语和英语中一周中日子的名称：",
    sun: "星期日",
    mon: "星期一",
    tue: "星期二",
    wed: "星期三",
    thu: "星期四",
    fri: "星期五",
    sat: "星期六",
    yesterday: "昨天",
    today: "今天",
    tomorrow: "明天",
    startLessonQuiz: "开始测验",
    questTitle: "第 4 部分：疑问词",
    questDesc: "欢迎来到疑问词探索。每个问题都有自己的分数，总分为 100 分。完成后，您可以直接将参与报告和分数发送给老师。",
    startQuest: "开始探索",
    backToHub: "回到首页",
    leaderboard: "排行榜",
    question: "问题",
    of: "之",
    student: "学生",
    mark: "问题分数",
    listen: "听句子",
    prev: "上一个问题",
    next: "下一个问题",
    correct: "正确答案",
    wrong: "正确答案",
    eliteBoard: "精英榜",
    noResults: "尚无保存的结果。",
    rank: "#",
    name: "姓名",
    score: "分数",
    date: "日期",
    back: "回到开始",
    certTitle: "结业证书",
    certText: "特此证明",
    certCompleted: "已成功完成阿拉伯语学习之旅的这一部分",
    totalScore: "总分",
    sendEmail: "打开邮件应用发送结果",
    showResults: "发送后显示结果",
    print: "打印证书",
    replay: "再玩一次",
    sendFirst: "您必须先将结果发送给老师，然后点击“发送后显示结果”。",
    details: "问题和分数详情",
    studentAns: "学生答案",
    correctAns: "正确答案",
    earned: "分数",
    returnToSummary: "返回摘要",
    returnToQuiz: "返回测试",
    footer: "学习阿拉伯语 — 由 Othman Marzoog 设计",
    skipBtn: "跳过问题",
    skipInfo: "您可以跳过此问题并获得满分，因为您连续答对了 5 个问题！",
    deactivateInfo: "不再显示此信息",
    lockedBtn: "请复习课程（{n} 秒后可用）",
    readAgain: "请仔细再次阅读文本",
    briefSummaryTitle: "简要总结",
    audioError: "音频错误",
    writtenTaskTitle: "书面任务",
    writtenTaskDesc: "请根据你在本部分学到的内容写一段简短的阿拉伯语文本。",
    submitTask: "提交任务",
    peerReviewTitle: "同行评审",
    peerReviewDesc: "请根据以下标准评估你同学的工作：",
    rubric1: "语言准确性 (Grammar and Language Accuracy)",
    rubric2: "词汇使用 (Vocabulary Use)",
    rubric3: "清晰度与组织 (Clarity and Organization)",
    rubric4: "流利度与表达 (Fluency and Expression)",
    rubric5: "任务完成情况 (Task Completion)",
    explainWhy: "如果未给出满分，请解释原因：",
    submitReview: "提交评审",
    waitingForReview: "正在等待同学评审你的工作...",
    needToReview: "你必须评审一位同学的工作才能完成本部分。",
    noTasksToReview: "目前没有可供评审的任务。请稍后再试。",
    reviewCompleted: "评审成功完成！",
    taskPromptLetters: "写出三个你认识的阿拉伯语单词，并解释构成它们的字母。",
    taskPromptGreetings: "使用你学到的问候语写一段两人之间的简短对话。",
    taskPromptDays: "使用一周中的天数写一段简短的话描述你的每周日程。",
    taskPromptQuest: "使用你学到的不同疑问词写五个问题。",
    taskPromptNumbers: "写一段包含阿拉伯数字的短文（例如：我的年龄、兄弟姐妹的人数等）。",
    taskPromptPronouns: "使用适当的代词写两句关于你自己和两句关于你朋友的句子。",
    taskPromptDemo: "使用近指代词描述你房间里的物体。",
    taskPromptNisba: "使用 Nisba 形容词写下你和你三个朋友的国籍。",
    taskPromptPhrases: "使用你在本课中学到的五个常用短语写一段短文。",
    part9Title: "第 10 部分：阿拉伯语介词",
    part9Desc: "学习阿拉伯语介词以及如何使用它们来连接单词并定义空间和时间关系。",
    lessonTitlePrepositions: "课程：阿拉伯语介词",
    lessonDescPrepositions: "介词将名词与其他单词连接起来，并使随后的名词变为属格 (Majrūr)。",
    taskPromptPrepositions: "写出五个包含你在本课中学到的不同介词的句子。",
    part10Title: "第 11 部分：阿拉伯语连词",
    part10Desc: "学习阿拉伯语连词以及如何使用它们来连接单词和句子。",
    lessonTitleConjunctions: "课程：阿拉伯语连词",
    lessonDescConjunctions: "连词是用于将两个单词、两个短语或两个句子连接在一起的词。",
    taskPromptConjunctions: "使用本课中学到的不同连词写五个句子。",
    part11Title: "第 12 部分：阅读《一千零一夜》",
    part11Desc: "通过《一千零一夜》的故事进行互动阅读之旅，全面复习之前的所有部分。",
    readingNight: "夜晚",
    readingStory: "故事",
    readingQuestions: "复习题",
    readingNextNight: "下一晚",
    readingFinish: "结束旅程",
  },
  fr: {
    title: "Apprendre l'Arabe",
    subtitle: "Plateforme d'Apprentissage de l'Arabe - Conçue par Othman Marzoog",
    welcome: "Bienvenue,",
    logout: "Se déconnecter",
    loginTitle: "Connexion à \"Apprendre l'Arabe\"",
    loginDesc: "Veuillez entrer vos coordonnées pour accéder aux leçons et aux tâches interactives.",
    studentName: "Nom de l'Étudiant",
    studentEmail: "Adresse E-mail",
    loginBtn: "Se Connecter",
    hubTitle: "Tableau de Bord - Leçons Disponibles",
    hubDesc: "Choisissez la partie que vous souhaitez étudier aujourd'hui :",
    part1Title: "Partie 2 : Salutations Arabes",
    part1Desc: "Apprenez à saluer, accueillir et dire au revoir en arabe.",
    startNow: "Commencer Maintenant",
    part2Title: "Partie 3 : Jours de la Semaine",
    part2Desc: "Apprenez les noms des jours de la semaine en arabe et comment les utiliser dans des phrases.",
    part3Title: "Partie 4 : Particules Interrogatives",
    part3Desc: "Quête Interrogative Arabe - Un voyage interactif pour apprendre les particules interrogatives en arabe.",
    part4Title: "Partie 5 : Nombres Arabes",
    part4Desc: "Apprenez les nombres arabes de 1 à 10 et comment effectuer des calculs simples.",
    part5Title: "Partie 6 : Pronoms Arabes",
    part5Desc: "Apprenez les pronoms indépendants en arabe et comment les utiliser pour la première, deuxième et troisième personne.",
    part6Title: "Partie 7 : Pronoms Démonstratifs",
    part6Desc: "Apprenez les pronoms démonstratifs pour les objets proches en arabe et comment les utiliser avec le singulier, le duel et le pluriel.",
    part7Title: "Partie 8 : Adjectif Nisba",
    part7Desc: "Apprenez à former des adjectifs Nisba en arabe pour indiquer l'origine ou l'appartenance.",
    partLettersTitle: "Partie 1 : Lettres Arabes",
    partLettersDesc: "Découvrez les formes des lettres arabes et comment elles se connectent pour former mots.",
    part8Title: "Partie 9 : Phrases Courantes",
    part8Desc: "Apprenez les phrases de base, les salutations, les expressions professionnelles, les voyages et la nourriture en arabe.",
    lessonTitlePhrases: "Leçon : Phrases Arabes Courantes",
    lessonDescPhrases: "Voici une collection de phrases arabes essentielles avec translittération et traduction :",
    phrasesBasic: "Phrases de Base",
    phrasesGreetings: "Salutations Courantes",
    phrasesFormal: "Discours Formel",
    phrasesWork: "Phrases au Travail",
    phrasesTravel: "Phrases de Voyage",
    phrasesFood: "Phrases de Nourriture",
    phrasesLove: "Phrases d'Amour",
    lessonTitleLetters: "Leçon : Formes des Lettres Arabes",
    lessonDescLetters: "L'arabe est une langue cursive où la plupart des lettres se connectent. Les formes des lettres changent selon leur position :",
    lettersSummary: "Six lettres sont 'non-connectrices' (Alif, Dāl, Dhāl, Rā’, Zāy, Wāw). Elles ne se connectent qu'à la lettre précédente.",
    letterFormIsolated: "Isolée",
    letterFormInitial: "Initiale",
    letterFormMedial: "Médiale",
    letterFormFinal: "Finale",
    lessonTitleNisba: "Leçon : Adjectif Nisba",
    lessonDescNisba: "Les adjectifs Nisba sont utilisés pour indiquer l'origine ou la nationalité. Voici les règles de base :",
    nisbaRule1: "1. Pour le Masculin :",
    nisbaRule1Desc: "Ajoutez un Yaa accentué (ـيّ) à la fin du nom (ex., Égypte -> Égyptien m.).",
    nisbaRule2: "2. Pour le Féminin :",
    nisbaRule2Desc: "Ajoutez un Yaa accentué et un Taa Marbuuta (ـيّة) à la fin (ex., Égypte -> Égyptienne f.).",
    nisbaRule3: "3. Suppressions :",
    nisbaRule3Desc: "Supprimez 'Al-', le 'ـة' final et le 'ـا/ـيا' final avant d'ajouter le suffixe.",
    lessonTitleDemo: "Leçon : Pronoms Démonstratifs (Proches)",
    lessonDescDemo: "Les pronoms démonstratifs sont utilisés pour désigner des objets ou des personnes proches :",
    demo1: "Hadha (Ceci m.) :",
    demo1Desc: "Pour le masculin singulier (ex., C'est un étudiant).",
    demo2: "Hadhihi (Ceci f.) :",
    demo2Desc: "Pour le féminin singulier (ex., C'est une étudiante).",
    demo3: "Hadhan (Ces deux m.) :",
    demo3Desc: "Pour le masculin duel (ex., Ce sont deux livres).",
    demo4: "Hatan (Ces deux f.) :",
    demo4Desc: "Pour le féminin duel (ex., Ce sont deux filles).",
    demo5: "Ha'ula'i (Ces pl.) :",
    demo5Desc: "Pour le pluriel (masculin et féminin) pour les personnes uniquement.",
    lessonTitlePronouns: "Leçon : Pronoms Arabes",
    lessonDescPronouns: "Les pronoms arabes sont divisés en trois catégories principales :",
    pronounType1: "1. Première Personne (Al-Mutakallim) :",
    pronounType1Desc: "Ana (Je), Nahnu (Nous)",
    pronounType2: "2. Deuxième Personne (Al-Mukhatab) :",
    pronounType2Desc: "Anta (Tu m.), Anti (Tu f.), Antuma (Vous deux), Antum (Vous pl. m.), Antunna (Vous pl. f.)",
    pronounType3: "3. Troisième Personne (Al-Gha'ib) :",
    pronounType3Desc: "Huwa (Il), Hiya (Elle), Huma (Ils deux), Hum (Ils pl. m.), Hunna (Elles pl. f.)",
    lessonTitleNumbers: "Leçon : Nombres Arabes",
    lessonDescNumbers: "Voici les nombres arabes de base et comment les écrire :",
    num1: "1 - Wahid",
    num2: "2 - Ithnan",
    num3: "3 - Thalatha",
    num4: "4 - Arba'a",
    num5: "5 - Khamsa",
    num6: "6 - Sitta",
    num7: "7 - Sab'a",
    num8: "8 - Thamania",
    num9: "9 - Tis'a",
    num10: "10 - 'Ashara",
    lessonTitleGreetings: "Leçon : Salutations Arabes",
    lessonDescGreetings: "Voici quelques salutations courantes et quand les utiliser :",
    greet1: "Assalamu Alaikum",
    greet1Desc: "Salutation islamique générale (utilisée à tout moment).",
    greet2: "Sabah al-Khair",
    greet2Desc: "Utilisé le matin (Réponse : Sabah al-Noor).",
    greet3: "Masa' al-Khair",
    greet3Desc: "Utilisé le soir (Réponse : Masa' al-Noor).",
    greet4: "Ma'a Salama",
    greet4Desc: "Utilisé lors des adieux.",
    greet5: "Kaifa Haluka?",
    greet5Desc: "Pour demander 'Comment vas-tu ?'.",
    greet6: "Shukran",
    greet6Desc: "Pour exprimer sa gratitude.",
    lessonTitle: "Leçon : Jours de la Semaine",
    lessonDesc: "Voici les noms des jours de la semaine en arabe et en anglais :",
    sun: "Dimanche",
    mon: "Lundi",
    tue: "Mardi",
    wed: "Mercredi",
    thu: "Jeudi",
    fri: "Vendredi",
    sat: "Samedi",
    yesterday: "Hier",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    startLessonQuiz: "Commencer le Quiz",
    questTitle: "Partie 4 : Particules Interrogatives",
    questDesc: "Bienvenue dans la Quête Interrogative. Chaque question a sa propre note, et le score total est sur 100. Une fois terminé, vous pouvez envoyer le rapport de participation et le score directement à l'enseignant.",
    startQuest: "Commencer la Quête",
    backToHub: "Retour à l'Accueil",
    leaderboard: "Classement",
    question: "Question",
    of: "de",
    student: "Étudiant",
    mark: "Note de la Question",
    listen: "Écouter la Phrase",
    prev: "Question Précédente",
    next: "Question Suivante",
    correct: "Réponse Correcte",
    wrong: "Réponse Correcte",
    eliteBoard: "Tableau Élite",
    noResults: "Aucun résultat enregistré pour le moment.",
    rank: "#",
    name: "Nom",
    score: "Score",
    date: "Date",
    back: "Retour au Début",
    certTitle: "Certificat de Réussite",
    certText: "Ceci certifie que",
    certCompleted: "a terminé avec succès cette partie du voyage d'apprentissage de l'arabe",
    totalScore: "Score Total",
    sendEmail: "Ouvrir l'E-mail pour Envoyer le Résultat",
    showResults: "Afficher les Résultats Après l'Envoi",
    print: "Imprimer le Certificat",
    replay: "Rejouer",
    sendFirst: "Vous devez d'abord envoyer le résultat à l'enseignant, puis cliquer sur \"Afficher les Résultats Après l'Envoi\".",
    details: "Détails des Questions et Notes",
    studentAns: "Réponse de l'Étudiant",
    correctAns: "Réponse Correcte",
    earned: "Note",
    returnToSummary: "Retour au Résumé",
    returnToQuiz: "Retour au Quiz",
    footer: "Apprendre l'Arabe — Conçu par Othman Marzoog",
    skipBtn: "Passer la Question",
    skipInfo: "Vous pouvez passer cette question et obtenir tous les points car vous avez répondu correctement à 5 questions d'affilée !",
    deactivateInfo: "Ne plus afficher cette info",
    lockedBtn: "Veuillez réviser la leçon (Disponible dans {n}s)",
    readAgain: "Veuillez relire attentivement le texte",
    briefSummaryTitle: "Résumé Bref",
    audioError: "Erreur Audio",
    writtenTaskTitle: "Tâche Écrite",
    writtenTaskDesc: "Veuillez écrire un court texte en arabe basé sur ce que vous avez appris dans cette partie.",
    submitTask: "Soumettre la Tâche",
    peerReviewTitle: "Évaluation par les Pairs",
    peerReviewDesc: "Veuillez évaluer le travail de votre pair selon les critères suivants :",
    rubric1: "Précision Linguistique (Grammar and Language Accuracy)",
    rubric2: "Utilisation du Vocabulaire (Vocabulary Use)",
    rubric3: "Clarté et Organisation (Clarity and Organization)",
    rubric4: "Fluidité et Expression (Fluency and Expression)",
    rubric5: "Réalisation de la Tâche (Task Completion)",
    explainWhy: "Veuillez expliquer pourquoi vous n'avez pas donné la note maximale :",
    submitReview: "Soumettre l'Évaluation",
    waitingForReview: "En attente de l'évaluation de votre travail par un pair...",
    needToReview: "Vous devez évaluer le travail d'un pair pour terminer cette partie.",
    noTasksToReview: "Aucune tâche disponible pour évaluation pour le moment. Veuillez réessayer plus tard.",
    reviewCompleted: "Évaluation terminée avec succès !",
    taskPromptLetters: "Écrivez trois mots arabes que vous connaissez et expliquez les lettres qui les forment.",
    taskPromptGreetings: "Écrivez un court dialogue entre deux personnes utilisant les salutations que vous avez apprises.",
    taskPromptDays: "Écrivez un court paragraphe décrivant votre emploi du temps hebdomadaire en utilisant les jours de la semaine.",
    taskPromptQuest: "Écrivez cinq questions en utilisant les différentes particules interrogatives que vous avez apprises.",
    taskPromptNumbers: "Écrivez un court paragraphe incluant des chiffres arabes (ex: mon âge, nombre de frères et sœurs, etc.).",
    taskPromptPronouns: "Écrivez deux phrases sur vous-même et deux phrases sur votre ami en utilisant les pronoms appropriés.",
    taskPromptDemo: "Décrivez les objets de votre chambre en utilisant les pronoms démonstratifs pour les objets proches.",
    taskPromptNisba: "Écrivez sur votre nationalité et celle de trois de vos amis en utilisant l'adjectif Nisba.",
    taskPromptPhrases: "Écrivez un court paragraphe utilisant cinq phrases courantes apprises dans cette leçon.",
    part9Title: "Partie 10 : Prépositions Arabes",
    part9Desc: "Apprenez les prépositions arabes et comment les utiliser pour lier des mots et définir des relations spatiales et temporelles.",
    lessonTitlePrepositions: "Leçon : Prépositions Arabes",
    lessonDescPrepositions: "Les prépositions lient les noms à d'autres mots et rendent le nom suivant génitif (Majrūr).",
    taskPromptPrepositions: "Écrivez cinq phrases contenant différentes prépositions apprises dans cette leçon.",
    part10Title: "Partie 11 : Conjonctions Arabes",
    part10Desc: "Apprenez les conjonctions arabes et comment les utiliser pour joindre des mots et des phrases.",
    lessonTitleConjunctions: "Leçon : Conjonctions Arabes",
    lessonDescConjunctions: "Les conjonctions sont des mots utilisés pour joindre deux mots, deux expressions ou deux phrases ensemble.",
    taskPromptConjunctions: "Écrivez cinq phrases en utilisant différentes conjonctions apprises dans cette leçon.",
    part11Title: "Partie 12 : Lecture des Mille et Une Nuits",
    part11Desc: "Un voyage de lecture interactif à travers les contes des Mille et Une Nuits avec une révision complète de toutes les parties précédentes.",
    readingNight: "Nuit",
    readingStory: "Histoire",
    readingQuestions: "Questions de Révision",
    readingNextNight: "Nuit Suivante",
    readingFinish: "Terminer le Voyage",
  },
  de: {
    title: "Arabisch Lernen",
    subtitle: "Arabisch-Lernplattform - Entworfen von Othman Marzoog",
    welcome: "Willkommen,",
    logout: "Abmelden",
    loginTitle: "Anmeldung bei \"Arabisch Lernen\"",
    loginDesc: "Bitte geben Sie Ihre Daten ein, um auf Lektionen und interaktive Aufgaben zuzugreifen.",
    studentName: "Name des Studenten",
    studentEmail: "E-Mail-Adresse",
    loginBtn: "Anmelden",
    hubTitle: "Dashboard - Verfügbare Lektionen",
    hubDesc: "Wählen Sie den Teil aus, den Sie heute studieren möchten:",
    part1Title: "Teil 2: Arabische Grüße",
    part1Desc: "Lernen Sie, wie man auf Arabisch grüßt, willkommen heißt und sich verabschiedet.",
    startNow: "Jetzt Starten",
    part2Title: "Teil 3: Wochentage",
    part2Desc: "Lernen Sie die Namen der Wochentage auf Arabisch und deren Verwendung in Sätzen.",
    part3Title: "Teil 4: Interrogativpartikeln",
    part3Desc: "Arabische Interrogativ-Quest - Eine interaktive Reise zum Erlernen von Interrogativpartikeln im Arabischen.",
    part4Title: "Teil 5: Arabische Zahlen",
    part4Desc: "Lernen Sie arabische Zahlen von 1 bis 10 und einfache Berechnungen.",
    part5Title: "Teil 6: Arabische Pronomen",
    part5Desc: "Lernen Sie unabhängige Pronomen im Arabischen und deren Verwendung für die erste, zweite und dritte Person.",
    part6Title: "Teil 7: Demonstrativpronomen",
    part6Desc: "Lernen Sie Demonstrativpronomen für nahe Objekte im Arabischen und deren Verwendung im Singular, Dual und Plural.",
    part7Title: "Teil 8: Nisba-Adjektiv",
    part7Desc: "Lernen Sie, wie man Nisba-Adjektive im Arabischen bildet, um Herkunft oder Zugehörigkeit auszudrücken.",
    partLettersTitle: "Teil 1: Arabische Buchstaben",
    partLettersDesc: "Lernen Sie die arabischen Buchstabenformen kennen und wie sie sich zu Wörtern verbinden.",
    part8Title: "Teil 9: Häufige Redewendungen",
    part8Desc: "Lernen Sie grundlegende Redewendungen, Grüße, Ausdrücke am Arbeitsplatz, Reisen und Essen auf Arabisch.",
    lessonTitlePhrases: "Lektion: Häufige arabische Redewendungen",
    lessonDescPhrases: "Hier ist eine Sammlung wichtiger arabischer Redewendungen mit Transliteration und Übersetzung:",
    phrasesBasic: "Grundlegende Sätze",
    phrasesGreetings: "Häufige Grüße",
    phrasesFormal: "Formelle Rede",
    phrasesWork: "Sätze am Arbeitsplatz",
    phrasesTravel: "Reisesätze",
    phrasesFood: "Essenssätze",
    phrasesLove: "Liebessätze",
    lessonTitleLetters: "Lektion: Arabische Buchstabenformen",
    lessonDescLetters: "Arabisch ist eine Kursivschrift, bei der sich die meisten Buchstaben verbinden. Die Buchstabenformen ändern sich je nach Position:",
    lettersSummary: "Sechs Buchstaben sind 'Nicht-Verbinder' (Alif, Dāl, Dhāl, Rā’, Zāy, Wāw). Sie verbinden sich nur mit dem vorhergehenden Buchstaben.",
    letterFormIsolated: "Isoliert",
    letterFormInitial: "Initial",
    letterFormMedial: "Medial",
    letterFormFinal: "Final",
    lessonTitleNisba: "Lektion: Nisba-Adjektiv",
    lessonDescNisba: "Nisba-Adjektive werden verwendet, um Herkunft oder Nationalität anzugeben. Hier sind die Grundregeln:",
    nisbaRule1: "1. Für Maskulinum:",
    nisbaRule1Desc: "Fügen Sie ein betontes Yaa (ـيّ) am Ende des Nomens hinzu (z. B. Ägypten -> Ägypter m.).",
    nisbaRule2: "2. Für Femininum:",
    nisbaRule2Desc: "Fügen Sie ein betontes Yaa und Taa Marbuuta (ـيّة) am Ende hinzu (z. B. Ägypten -> Ägypterin f.).",
    nisbaRule3: "3. Löschungen:",
    nisbaRule3Desc: "Entfernen Sie 'Al-', das finale 'ـة' und das finale 'ـا/ـيا' vor dem Hinzufügen des Suffixes.",
    lessonTitleDemo: "Lektion: Demonstrativpronomen (Nah)",
    lessonDescDemo: "Demonstrativpronomen werden verwendet, um auf nahegelegene Objekte oder Personen zu zeigen:",
    demo1: "Hadha (Dies m.):",
    demo1Desc: "Für Singular Maskulinum (z. B. Dies ist ein Student).",
    demo2: "Hadhihi (Dies f.):",
    demo2Desc: "Für Singular Femininum (z. B. Dies ist eine Studentin).",
    demo3: "Hadhan (Diese zwei m.):",
    demo3Desc: "Für Dual Maskulinum (z. B. Dies sind zwei Bücher).",
    demo4: "Hatan (Diese zwei f.):",
    demo4Desc: "Für Dual Femininum (z. B. Dies sind zwei Mädchen).",
    demo5: "Ha'ula'i (Diese pl.):",
    demo5Desc: "Für Plural (maskulin und feminin) nur für Personen.",
    lessonTitlePronouns: "Lektion: Arabische Pronomen",
    lessonDescPronouns: "Arabische Pronomen werden in drei Hauptkategorien unterteilt:",
    pronounType1: "1. Erste Person (Al-Mutakallim):",
    pronounType1Desc: "Ana (Ich), Nahnu (Wir)",
    pronounType2: "2. Zweite Person (Al-Mukhatab):",
    pronounType2Desc: "Anta (Du m.), Anti (Du f.), Antuma (Ihr zwei), Antum (Ihr pl. m.), Antunna (Ihr pl. f.)",
    pronounType3: "3. Dritte Person (Al-Gha'ib):",
    pronounType3Desc: "Huwa (Er), Hiya (Sie), Huma (Sie zwei), Hum (Sie pl. m.), Hunna (Sie pl. f.)",
    lessonTitleNumbers: "Lektion: Arabische Zahlen",
    lessonDescNumbers: "Hier sind die grundlegenden arabischen Zahlen und ihre Schreibweise:",
    num1: "1 - Wahid",
    num2: "2 - Ithnan",
    num3: "3 - Thalatha",
    num4: "4 - Arba'a",
    num5: "5 - Khamsa",
    num6: "6 - Sitta",
    num7: "7 - Sab'a",
    num8: "8 - Thamania",
    num9: "9 - Tis'a",
    num10: "10 - 'Ashara",
    lessonTitleGreetings: "Lektion: Arabische Grüße",
    lessonDescGreetings: "Hier sind einige gebräuchliche Grüße und deren Verwendung:",
    greet1: "Assalamu Alaikum",
    greet1Desc: "Allgemeiner islamischer Gruß (jederzeit verwendbar).",
    greet2: "Sabah al-Khair",
    greet2Desc: "Am Morgen verwendet (Antwort: Sabah al-Noor).",
    greet3: "Masa' al-Khair",
    greet3Desc: "Am Abend verwendet (Antwort: Masa' al-Noor).",
    greet4: "Ma'a Salama",
    greet4Desc: "Wird beim Abschied verwendet.",
    greet5: "Kaifa Haluka?",
    greet5Desc: "Um zu fragen 'Wie geht es dir?'.",
    greet6: "Shukran",
    greet6Desc: "Um Dankbarkeit auszudrücken.",
    lessonTitle: "Lektion: Wochentage",
    lessonDesc: "Hier sind die Namen der Wochentage auf Arabisch und Englisch:",
    sun: "Sonntag",
    mon: "Montag",
    tue: "Dienstag",
    wed: "Mittwoch",
    thu: "Donnerstag",
    fri: "Freitag",
    sat: "Samstag",
    yesterday: "Gestern",
    today: "Heute",
    tomorrow: "Morgen",
    startLessonQuiz: "Quiz Starten",
    questTitle: "Teil 4: Interrogativpartikeln",
    questDesc: "Willkommen beim Interrogativ-Quest. Jede Frage hat ihre eigene Note, und die Gesamtpunktzahl beträgt 100. Nach Abschluss können Sie den Teilnahmebericht und die Punktzahl direkt an den Lehrer senden.",
    startQuest: "Quest Starten",
    backToHub: "Zurück zum Dashboard",
    leaderboard: "Bestenliste",
    question: "Frage",
    of: "von",
    student: "Student",
    mark: "Fragenote",
    listen: "Satz Anhören",
    prev: "Vorherige Frage",
    next: "Nächste Frage",
    correct: "Richtige Antwort",
    wrong: "Richtige Antwort",
    eliteBoard: "Elite-Board",
    noResults: "Noch keine gespeicherten Ergebnisse.",
    rank: "#",
    name: "Name",
    score: "Punktzahl",
    date: "Datum",
    back: "Zurück zum Start",
    certTitle: "Abschlusszertifikat",
    certText: "Dies bescheinigt, dass",
    certCompleted: "diesen Teil der arabischen Lernreise erfolgreich abgeschlossen hat",
    totalScore: "Gesamtpunktzahl",
    sendEmail: "E-Mail-App zum Senden des Ergebnisses öffnen",
    showResults: "Ergebnisse nach dem Senden anzeigen",
    print: "Zertifikat Drucken",
    replay: "Erneut Spielen",
    sendFirst: "Sie müssen das Ergebnis zuerst an den Lehrer senden und dann auf \"Ergebnisse nach dem Senden anzeigen\" klicken.",
    details: "Fragen- & Notendetails",
    studentAns: "Antwort des Studenten",
    correctAns: "Richtige Antwort",
    earned: "Note",
    returnToSummary: "Zurück zur Zusammenfassung",
    returnToQuiz: "Zurück zum Quiz",
    footer: "Arabisch Lernen — Entworfen von Othman Marzoog",
    skipBtn: "Frage Überspringen",
    skipInfo: "Sie können diese Frage überspringen und die volle Punktzahl erhalten, da Sie 5 Fragen hintereinander richtig beantwortet haben!",
    deactivateInfo: "Diese Info nicht mehr anzeigen",
    lockedBtn: "Bitte wiederholen Sie die Lektion (Verfügbar in {n}s)",
    readAgain: "Bitte lesen Sie den Text sorgfältig noch einmal",
    briefSummaryTitle: "Kurze Zusammenfassung",
    audioError: "Audiofehler",
    writtenTaskTitle: "Schriftliche Aufgabe",
    writtenTaskDesc: "Bitte schreiben Sie einen kurzen Text auf Arabisch, basierend auf dem, was Sie in diesem Teil gelernt haben.",
    submitTask: "Aufgabe einreichen",
    peerReviewTitle: "Peer-Review",
    peerReviewDesc: "Bitte bewerten Sie die Arbeit Ihres Mitschülers nach den folgenden Kriterien:",
    rubric1: "Sprachliche Genauigkeit (Grammar and Language Accuracy)",
    rubric2: "Wortschatzverwendung (Vocabulary Use)",
    rubric3: "Klarheit und Organisation (Clarity and Organization)",
    rubric4: "Flüssigkeit und Ausdruck (Fluency and Expression)",
    rubric5: "Aufgabenerfüllung (Task Completion)",
    explainWhy: "Bitte erklären Sie, warum Sie keine volle Punktzahl gegeben haben:",
    submitReview: "Bewertung abschicken",
    waitingForReview: "Warten auf die Bewertung Ihrer Arbeit durch einen Mitschüler...",
    needToReview: "Sie müssen die Arbeit eines Mitschülers bewerten, um diesen Teil abzuschließen.",
    noTasksToReview: "Derzeit sind keine Aufgaben zur Bewertung verfügbar. Bitte versuchen Sie es später noch einmal.",
    reviewCompleted: "Bewertung erfolgreich abgeschlossen!",
    taskPromptLetters: "Schreiben Sie drei arabische Wörter, die Sie kennen, und erklären Sie die Buchstaben, aus denen sie bestehen.",
    taskPromptGreetings: "Schreiben Sie einen kurzen Dialog zwischen zwei Personen mit den gelernten Begrüßungen.",
    taskPromptDays: "Schreiben Sie einen kurzen Absatz, in dem Sie Ihren Wochenplan mit den Wochentagen beschreiben.",
    taskPromptQuest: "Schreiben Sie fünf Fragen mit den verschiedenen gelernten Fragewörtern.",
    taskPromptNumbers: "Schreiben Sie einen kurzen Absatz mit arabischen Zahlen (z. B. mein Alter, Anzahl der Geschwister usw.).",
    taskPromptPronouns: "Schreiben Sie zwei Sätze über sich selbst und zwei über Ihren Freund mit den entsprechenden Pronomen.",
    taskPromptDemo: "Beschreiben Sie die Gegenstände in Ihrem Zimmer mit Demonstrativpronomen für nahe Gegenstände.",
    taskPromptNisba: "Schreiben Sie über Ihre Nationalität und die von drei Ihrer Freunde mit dem Nisba-Adjektiv.",
    taskPromptPhrases: "Schreiben Sie einen kurzen Absatz mit fünf gängigen Sätzen, die Sie in dieser Lektion gelernt haben.",
    part9Title: "Teil 10: Arabische Präpositionen",
    part9Desc: "Lernen Sie arabische Präpositionen und wie man sie verwendet, um Wörter zu verknüpfen und räumliche und zeitliche Beziehungen zu definieren.",
    lessonTitlePrepositions: "Lektion: Arabische Präpositionen",
    lessonDescPrepositions: "Präpositionen verbinden Substantive mit anderen Wörtern und machen das folgende Substantiv zum Genitiv (Majrūr).",
    taskPromptPrepositions: "Schreiben Sie fünf Sätze mit verschiedenen Präpositionen, die Sie in dieser Lektion gelernt haben.",
    part10Title: "Teil 11: Arabische Konjunktionen",
    part10Desc: "Lernen Sie arabische Konjunktionen und wie man sie verwendet, um Wörter und Sätze zu verbinden.",
    lessonTitleConjunctions: "Lektion: Arabische Konjunktionen",
    lessonDescConjunctions: "Konjunktionen sind Wörter, die verwendet werden, um zwei Wörter, zwei Phrasen oder zwei Sätze miteinander zu verbinden.",
    taskPromptConjunctions: "Schreiben Sie fünf Sätze mit verschiedenen Konjunktionen, die Sie in dieser Lektion gelernt haben.",
    part11Title: "Teil 12: Lesen von Tausendundeine Nacht",
    part11Desc: "Eine interaktive Lesereise durch die Geschichten von Tausendundeine Nacht mit einer umfassenden Wiederholung aller vorherigen Teile.",
    readingNight: "Nacht",
    readingStory: "Geschichte",
    readingQuestions: "Wiederholungsfragen",
    readingNextNight: "Nächste Nacht",
    readingFinish: "Reise Beenden",
  },
};

const languages = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
] as const;

type LangCode = typeof languages[number]['code'];

interface WrittenTaskViewProps {
  t: (key: any) => string;
  currentModule: string;
  studentName: string;
  studentEmail: string;
  writtenTaskContent: string;
  setWrittenTaskContent: (val: string) => void;
  fetchPendingTask: () => Promise<void>;
  setScreen: (screen: any) => void;
}

const STORY_NIGHTS = [
  {
    title: "تمهيد: قصة الملك شهريار وشهرزاد",
    titleEn: "Introduction: The Story of King Shahryar and Scheherazade",
    content: "ُيحكى أنه في قديم الزمان عاش ملكان عظيمان شقيقان ُيدعيان شهريار وشاهزمان. كان شهريار هو الأكبر سنّاً، وامتد سلطانه إلى أقاصي الأرض.\n\nشعر شهريار برغبة في رؤية أخيه، فطلب من كبير وزرائه الذهاب لإحضاره إليه. وعندما حضر شاهزمان، عانقه أخوه، وقضى الأخوان اليوم بأكمله معاً، ولاحظ شهريار الشحوب والمرض على أخيه.\n\nمرت الأيام، وشاهزمان يزداد نحولاً، واعتقد شهريار أن أخاه مشتاق لوطنه، لكن تبين أن الأمر أسوأ من ذلك بكثير. فبعد عشرة أيام، انهار شاهزمان وأخبر أخاه بالسبب الرئيسي وراء أحزانه. لقد هجرته زوجته الملكة، وهو الآن كسير الفؤاد. وقص على شهريار كيف تعرض للخيانة، ولم يستطع الملك العظيم تصديق ما تسمعه أذناه.\n\nوبعد سماع ما رواه أخوه، غضب شهريار غضباً شديداً حتى إنه فقد صوابه، وقرر أنه لا يمكن الثقة في أي امرأة قط، وخطط لأمر مريع. استدعى الملك وزيره، وطلب منه أن يبحث له عن زوجة. وكان يعتزم الزواج منها يوماً واحداً ثم قتلها، على أن يستمر في ذلك حتى يقضي على جميع النساء في مملكته.\n\nكان للوزير ابنة كبرى تُدعى شهرزاد، وأخرى صغرى تُدعى دينارزاد. طالعت الابنة الكبرى كتباً كثيرة واتسمت باتساع ثقافتها. وعندما سمعت بمخطط الملك البغيض، قالت لوالدها: «أود أن تزوجني الملك شهريار، حتى أتمكن من إنقاذ شعبنا أو الموت مثل باقي الفتيات.»\n\nوعند سماع الوزير ما قالته ابنته، استشاط غضباً وحرّم عليها الزواج من الملك. وأخذا يتجادلان معاً فترة طويلة، لكن شهرزاد لم تكن لتغير رأيها، فأرسلها الوزير لتصبح زوجة الملك، وهو يقول: «أدعو الله ألا يحرمني منك.»\n\nغمرت السعادة قلب شهرزاد، وبعد أن تهيأت وحزمت أمتعتها، ذهبت إلى أختها الصغرى، دينارزاد، وقالت لها: «أختاه، أنصتي إليّ جيداً. عندما أذهب إلى الملك، سأرسل في طلبك، وعندما تحضرين، عليك أن تقولي: «أختاه، إذا لم يكن النوم يغالبك، فاروي لنا قصة.» فبذلك سيطلق الملك سراحي، وسأنقذ الناس في المملكة. عليكِ أن تثقي في هذه الخطة.»\n\nفأجابت دينارزاد: «عظيم.»\n\nفي تلك الليلة، اصطحب الوزير شهرزاد إلى الملك العظيم شهريار، وزوجها له. لكن عندما ذهب الملك شهريار للنوم في تلك الليلة، بكت شهرزاد. وعندما سألها الملك عن سبب بكائها، أجابت: «لديّ أخت، وأود أن أودعها.»\n\nفأرسل الملك في طلب الأخت التي حضرت وجلست على الأرض بجانب السرير. قالت دينارزاد: «أختاه، إذا لم يكن النوم يغالبك، فاروي لنا إحدى رواياتك الممتعة لنمضي الليلة، فأنا أخشى غيابك عني.»\n\nاستدارت شهرزاد نحو الملك شهريار، وقالت: «هل تأذن لي برواية قصة؟» فرد شهريار: «نعم.» وسعدت شهرزاد للغاية، وقالت: «اسمعا.»",
    contentEn: "It is related that in ancient times there lived two great kings who were brothers, named Shahryar and Shahzaman. Shahryar was the elder, and his dominion extended to the ends of the earth.\n\nShahryar felt a desire to see his brother, so he asked his grand vizier to go and bring him. When Shahzaman arrived, his brother embraced him, and the two brothers spent the entire day together, but Shahryar noticed paleness and illness in his brother.\n\nDays passed, and Shahzaman grew thinner. Shahryar thought his brother was homesick, but it turned out the matter was much worse. After ten days, Shahzaman broke down and told his brother the main reason for his sorrow. His wife, the queen, had abandoned him, and he was now heartbroken. He told Shahryar how he had been betrayed, and the great king could not believe his ears.\n\nAfter hearing what his brother told him, Shahryar became so furious that he lost his mind and decided that no woman could ever be trusted. He planned a terrible thing: he summoned his vizier and asked him to find him a wife. He intended to marry her for one day and then kill her, continuing this until he had eliminated all the women in his kingdom.\n\nThe vizier had an elder daughter named Scheherazade and a younger one named Dunyazad. The elder daughter had read many books and was known for her vast culture. When she heard of the king's hateful plan, she said to her father, 'I want you to marry me to King Shahryar, so that I can save our people or die like the rest of the girls.'\n\nUpon hearing what his daughter said, the vizier was enraged and forbade her from marrying the king. They argued for a long time, but Scheherazade would not change her mind, so the vizier sent her to become the king's wife, saying, 'I pray to God not to deprive me of you.'\n\nJoy filled Scheherazade's heart, and after she prepared and packed her belongings, she went to her younger sister, Dunyazad, and said to her, 'Sister, listen to me carefully. When I go to the king, I will send for you, and when you come, you must say: \"Sister, if sleep does not overcome you, tell us a story.\" By doing so, the king will release me, and I will save the people in the kingdom. You must trust this plan.' Dunyazad replied, 'Great.'\n\nThat night, the vizier took Scheherazade to the great King Shahryar and married her to him. But when King Shahryar went to sleep that night, Scheherazade wept. When the king asked her why she was crying, she replied, 'I have a sister, and I would like to say goodbye to her.'\n\nSo the king sent for the sister, who came and sat on the floor beside the bed. Dunyazad said, 'Sister, if sleep does not overcome you, tell us one of your enjoyable stories to pass the night, for I fear your absence.'\n\nScheherazade turned to King Shahryar and asked, 'Will you permit me to tell a story?' Shahryar replied, 'Yes.' Scheherazade was extremely happy and said, 'Listen.'",
    reviewPart: 1,
    questions: [
      { q: "من هو الملك الكبير؟", qEn: "Who is the elder King?", a: "شهريار", options: ["شهريار", "شاهزمان", "جعفر", "مسرور"], optionsEn: ["Shahryar", "Shahzaman", "Ja'far", "Masrur"] },
      { q: "أين كان يحكم شاهزمان؟", qEn: "Where did Shahzaman rule?", a: "سمرقند", options: ["بغداد", "سمرقند", "القاهرة", "دمشق"], optionsEn: ["Baghdad", "Samarkand", "Cairo", "Damascus"] },
      { q: "ماذا قرر شهريار أن يفعل كل ليلة؟", qEn: "What did Shahryar decide to do every night?", a: "يتزوج ويقتل", options: ["يسافر", "يتزوج ويقتل", "يصطاد", "يقرأ"], optionsEn: ["Travel", "Marry and kill", "Hunt", "Read"] },
      { q: "من هي ابنة الوزير؟", qEn: "Who is the Vizier's daughter?", a: "شهرزاد", options: ["دنيازاد", "شهرزاد", "مرجانة", "بدور"], optionsEn: ["Dunyazad", "Scheherazade", "Morgiana", "Budour"] },
      { q: "ماذا وجدت شهرزاد في الكتب؟", qEn: "What did Scheherazade find in books?", a: "حكايات الملوك", options: ["حكايات الملوك", "وصفات طبخ", "خرائط", "أشعار"], optionsEn: ["Tales of Kings", "Cooking recipes", "Maps", "Poems"] }
    ]
  },
  {
    title: "الليلة الأولى: قصة التاجر وزوجته",
    titleEn: "Night 1: The Story of the Merchant and His Wife",
    content: "بلغني — أيها الملك السعيد ذو الرأي الرشيد — أنه كان هناك تاجر ثري يعد لزيارة بلد آخر. فملأ حقائبه بالخبز والتمر، وامتطى حصانه. واستمر سفره عدة ليالٍ في رعاية الله حتى وصل إلى وجهته. وعند الانتهاء من زيارته، توجه عائداً إلى وطنه. فسافر مدة ثلاثة أيام، وفي اليوم الرابع وجد بستاناً، فدخله ليستظل فيه من الشمس. جلس على ضفة جدول مائي تحت شجرة جوز، وأخرج بعض أرغفة الخبز وحفنة من التمر، وبدأ في الأكل ملقياً نوى التمر عن يمينه وعن يساره حتى اكتفى، ثم نهض وتلا صلاته.\n\nوما كاد ينهي صلاته حتى رأى جنياً كبيراً أمامه ممسكاً بسيف في يده، ويقف بقدميه على الأرض ورأسه تناطح السحاب. صاح الجني: «انهض حتى أتمكن من قتلك بهذا السيف، كما قتلت ابني.»\n\nفزع التاجر، وقال: «أقسم بالله أنني لم أقتل ابنك، كيف حدث ذلك؟» قال الجني: «ألم تجلس، وتخرج بعض التمر من حقيبتك، وتأكله ملقياً النوى حولك؟» رد التاجر: «نعم، فعلت.» فقال الجني: «عندما كنت تلقي النوى، كان ابني يسير بجوارك، فصدمته واحدة وقتلته، وعليّ أن أقتلك الآن.»\n\nقال التاجر: «يا إلهي، أرجوك لا تقتلني.» فرد الجني: «أقسم بالله أن أقتلك كما قتلت ابني.» قال التاجر: «إذا كنت قد قتلته، فقد فعلت ذلك عن طريق الخطأ. أرجو أن تسامحني.» رد الجني: «يجب أن أقتلك.» وأمسك بالتاجر، وألقى به على الأرض.",
    contentEn: "It has reached me, O happy King of sound judgment, that there was a wealthy merchant preparing to visit another country. He filled his bags with bread and dates and mounted his horse. His journey continued for several nights under God's care until he reached his destination. Upon finishing his visit, he headed back to his homeland. He traveled for three days, and on the fourth day, he found a garden and entered it to seek shade from the sun. He sat on the bank of a stream under a walnut tree, took out some loaves of bread and a handful of dates, and began to eat, throwing the date pits to his right and left until he was satisfied. Then he stood up and said his prayers.\n\nHardly had he finished his prayers when he saw a huge genie before him, holding a sword in his hand, standing with his feet on the ground and his head touching the clouds. The genie shouted, 'Get up so I can kill you with this sword, as you killed my son.'\n\nThe merchant was terrified and said, 'I swear by God that I did not kill your son. How did that happen?' The genie said, 'Did you not sit down, take some dates from your bag, and eat them while throwing the pits around you?' The merchant replied, 'Yes, I did.' The genie said, 'When you were throwing the pits, my son was walking beside you. One hit him and killed him, and I must kill you now.'\n\nThe merchant said, 'O my God, please do not kill me.' The genie replied, 'I swear by God to kill you as you killed my son.' The merchant said, 'If I killed him, I did so by mistake. Please forgive me.' The genie replied, 'I must kill you.' He grabbed the merchant and threw him to the ground.",
    reviewPart: 1,
    questions: [
      { q: "ما هو الحرف الأول في كلمة 'الملك'؟", qEn: "What is the first letter in the word 'Al-Malik'?", a: "ا", options: ["ب", "ا", "ل", "م"], optionsEn: ["B", "A", "L", "M"] },
      { q: "كم عدد حروف كلمة 'بلد'؟", qEn: "How many letters are in the word 'Balad'?", a: "3", options: ["2", "3", "4", "5"], optionsEn: ["2", "3", "4", "5"] },
      { q: "أي حرف في 'تاجر' هو حرف 'عنيد' (لا يتصل بما بعده)؟", qEn: "Which letter in 'Tajir' is a 'stubborn' letter (doesn't connect to the next)?", a: "ر", options: ["ت", "ا", "ج", "ر"], optionsEn: ["T", "A", "J", "R"] },
      { q: "ما هو الحرف الأخير في كلمة 'سفر'؟", qEn: "What is the last letter in the word 'Safar'?", a: "ر", options: ["س", "ف", "ر", "ب"], optionsEn: ["S", "F", "R", "B"] },
      { q: "ما هو الحرف الذي يبدأ به 'بستان'؟", qEn: "What letter does 'Bustan' start with?", a: "ب", options: ["ت", "ب", "ن", "ي"], optionsEn: ["T", "B", "N", "Y"] }
    ]
  },
  {
    title: "الليلة الثانية: عودة التاجر",
    titleEn: "Night 2: The Merchant's Return",
    content: "ظل الملك شهريار يعمل طوال اليوم التالي، وعاد إلى المنزل في الليل إلى شهرزاد. فقالت دينارزاد لأختها: «رجا ًء يا أختاه، إذا لم يكن النوم يغالبك، فاروي لنا إحدى قصصك الممتعة.» وأضاف الملك: «لتكن نهاية قصة الجني والتاجر.» فردت شهرزاد: «بكل سرور، أيها الملك السعيد.»\n\nبلغني — أيها الملك السعيد ذو الرأي الرشيد — أنه عندما رفع الجني سيفه، قال له التاجر متوسلاً: «أرجوك دعني أودع أسرتي وزوجتي وأبنائي قبل أن تقتلني.» وسأله الجني: «هل تقسم باالله أنني إذا تركتك تذهب، فسوف تعود بعد سنة من تاريخ هذا اليوم؟» فرد التاجر: «نعم، أقسم باالله.»\n\nوبعد أن أقسم التاجر بذلك، تركه الجني يذهب، فامتطى حصانه ومضى في طريقه، ليصل أخيراً إلى منزله وزوجته وأبنائه. وعندما رآهم، أخذ يبكي بحرقة؛ فسألته زوجته: «ما بك يا زوجي؟ لماذا تشعر بالحزن وجميعنا سعداء ونحتفل بعودتك إلينا؟» فأجاب: «ولماذا لا أحزن وما تبقى لي من العمر سوى سنة واحدة فقط؟» ثم أخبرها بكل شيء حدث مع الجني.\n\nعندما سمعت أسرته ما قاله، أخذوا يبكون، وكان يوماً حزيناً حيث تجمع جميع الأطفال حول والدهم. قضى التاجر ما تبقى من العام على هذه الحال، ثم صلى لربه وودع أسرته. فتعلق أبناؤه برقبته، وبكت بناته، وناحت زوجته. فقال لهم: «يا أبنائي، هذه مشيئة الله.» ثم انصرف، وامتطى حصانه، وسافر حتى وصل إلى البستان.",
    contentEn: "King Shahryar continued to work throughout the following day and returned home at night to Scheherazade. Dunyazad said to her sister, 'Please, sister, if sleep does not overcome you, tell us one of your enjoyable stories.' The King added, 'Let it be the end of the story of the genie and the merchant.' Scheherazade replied, 'With pleasure, O happy King.'\n\nIt has reached me, O happy King of sound judgment, that when the genie raised his sword, the merchant said to him imploringly, 'Please let me say goodbye to my family, my wife, and my children before you kill me.' The genie asked him, 'Do you swear by God that if I let you go, you will return after one year from this day?' The merchant replied, 'Yes, I swear by God.'\n\nAfter the merchant had sworn this, the genie let him go. He mounted his horse and went on his way, finally reaching his home, his wife, and his children. When he saw them, he began to weep bitterly. His wife asked him, 'What is the matter, my husband? Why do you feel sad when we are all happy and celebrating your return to us?' He replied, 'And why should I not be sad when I have only one year of life left?' Then he told her everything that had happened with the genie.\n\nWhen his family heard what he said, they began to weep, and it was a sad day as all the children gathered around their father. The merchant spent the remainder of the year in this state, then prayed to his Lord and bid his family farewell. His sons clung to his neck, his daughters wept, and his wife wailed. He said to them, 'O my children, this is God's will.' Then he departed, mounted his horse, and traveled until he reached the garden.",
    reviewPart: 1,
    questions: [
      { q: "ما هو الحرف الذي ينتهي به اسم 'التاجر'؟", qEn: "What letter does the name 'Al-Tajir' end with?", a: "ر", options: ["ر", "د", "ز", "و"], optionsEn: ["R", "D", "Z", "W"] },
      { q: "كلمة 'بكى' تبدأ بحرف:", qEn: "The word 'Baka' (cried) starts with the letter:", a: "ب", options: ["ت", "ب", "ي", "ن"], optionsEn: ["T", "B", "Y", "N"] },
      { q: "حرف 'الواو' في 'ولد' هو حرف:", qEn: "The letter 'Waw' in 'Walad' is a:", a: "عنيد", options: ["متصل", "عنيد", "مهموس", "مجهور"], optionsEn: ["Connected", "Stubborn", "Whispered", "Voiced"] },
      { q: "ما هو الحرف الأوسط في كلمة 'مات'؟", qEn: "What is the middle letter in the word 'Maat' (died)?", a: "ا", options: ["م", "ا", "ت", "ب"], optionsEn: ["M", "A", "T", "B"] },
      { q: "كلمة 'ساعة' تنتهي بـ:", qEn: "The word 'Sa'ah' (hour) ends with:", a: "تاء مربوطة", options: ["تاء مفتوحة", "هاء", "تاء مربوطة", "ألف"], optionsEn: ["Open Ta", "Ha", "Ta Marbuta", "Alif"] }
    ]
  },
  {
    title: "الليلة الثالثة: انتظار الجني (تتمة)",
    titleEn: "Night 3: Waiting for the Genie (Continued)",
    content: "جلس التاجر في المكان الذي تناول فيه التمر في انتظار الجني والدموع تملأ عينيه. وأثناء انتظاره، اقترب منه رجل عجوز يقود كلبين مربوطين بحزامين حول عنقيهما، وألقى عليه التحية. فرد عليه التاجر التحية. سأله الرجل العجوز: «لماذا تجلس هنا، يا صاحبي، في هذا المكان الممتلئ بالجن والشياطين؟ فما من شيء في هذا البستان المسكون سوى الحزن والأسى.»\n\nأخبره التاجر بكل ما حدث مع الجني، فاندهش الرجل العجوز من القصة، وقال: «إن وعدك بالرجوع إلى هنا من أفعال الشجعان. والله لن أتركك حتى أرى ما سيحدث مع الجني.» وجلس بعد ذلك بجانبه وتبادلا أطراف الحديث.\n\nوهنا أدرك شهرزاد الصباح، فسكتت عن الكلام المباح. ومع طلوع الفجر، قالت دينارزاد لأختها: «يا لها من قصة غريبة وجميلة!» فردت شهرزاد: «ليلة غد، سأخبركما بما هو أفضل وأكثر إمتاعاً.»",
    contentEn: "The merchant sat in the place where he had eaten the dates, waiting for the genie with tears filling his eyes. While he was waiting, an old man leading two dogs tied with belts around their necks approached him and greeted him. The merchant returned the greeting. The old man asked him, 'Why are you sitting here, my friend, in this place full of jinn and demons? For there is nothing in this haunted garden but sorrow and grief.'\n\nThe merchant told him everything that had happened with the genie. The old man was amazed by the story and said, 'Your promise to return here is the act of a brave man. By God, I will not leave you until I see what happens with the genie.' He then sat beside him and they conversed.\n\nAt this point, Scheherazade perceived the dawn and fell silent from her permitted speech. With the break of day, Dunyazad said to her sister, 'What a strange and beautiful story!' Scheherazade replied, 'Tomorrow night, I will tell you something even better and more enjoyable.'",
    reviewPart: 1,
    questions: [
      { q: "كلمة 'سنة' تبدأ بحرف:", qEn: "The word 'Sanah' (year) starts with the letter:", a: "س", options: ["ش", "س", "ص", "ض"], optionsEn: ["Sh", "S", "S (Sad)", "D (Dad)"] },
      { q: "ما هو الحرف الأخير في 'مكان'؟", qEn: "What is the last letter in 'Makan' (place)?", a: "ن", options: ["م", "ك", "ا", "ن"], optionsEn: ["M", "K", "A", "N"] },
      { q: "كلمة 'عين' تبدأ بحرف:", qEn: "The word 'Ayn' (eye) starts with the letter:", a: "ع", options: ["غ", "ع", "ح", "خ"], optionsEn: ["Gh", "Ayn", "H", "Kh"] },
      { q: "كم عدد حروف كلمة 'عاد'؟", qEn: "How many letters are in the word 'Aad' (returned)?", a: "3", options: ["2", "3", "4", "5"], optionsEn: ["2", "3", "4", "5"] },
      { q: "ما هو الحرف الأول في 'دموع'؟", qEn: "What is the first letter in 'Dumu' (tears)?", a: "د", options: ["د", "ذ", "ر", "ز"], optionsEn: ["D", "Dh", "R", "Z"] }
    ]
  },
  {
    title: "الليلة الثالثة: الشيخ والكلبان",
    titleEn: "Night 3: The Old Man and the Two Dogs",
    content: "في الليلة التالية، قالت دينارزاد لأختها: «رجاءً يا أختاه، إذا لم يكن النوم يغالبك، فاروي لنا واحدة من قصصك الممتعة.» وأضاف الملك: «لتكن نهاية قصة التاجر، فأنا أود سماعها.» فأجابت شهرزاد: «كما تشاءان.»\n\nبلغني — أيها الملك السعيد — أنه بينما كان التاجر والرجل صاحب الكلبين الأسودين يتحدثان معاً، أبصرا فجأة تراباً يتصاعد، وعندما تبدد، شاهدا الجني وهو يقترب منهما ممسكاً بسيف فولاذي في يده. ووقف أمامهما دون أن يلقي التحية، وقال للتاجر: «تأهب للموت.» فأخذ التاجر والرجل العجوز في البكاء.\n\nاقترب الرجل العجوز صاحب الكلبين الأسودين من الجني، وقال له: «إذا أخبرتك بما حدث لي ولهذين الكلبين، ووجدت روايتي أكثر غرابة وإدهاشاً مما حدث لك مع التاجر، فهل ستعتقه؟» فأجاب الجني: «نعم، سأفعل.»",
    contentEn: "The following night, Dunyazad said to her sister, 'Please, sister, if sleep does not overcome you, tell us one of your enjoyable stories.' The King added, 'Let it be the end of the merchant's story, for I wish to hear it.' Scheherazade replied, 'As you both wish.'\n\nIt has reached me, O happy King, that while the merchant and the man with the two black dogs were talking together, they suddenly saw dust rising. When it cleared, they saw the genie approaching them, holding a steel sword in his hand. He stood before them without greeting and said to the merchant, 'Prepare for death.' The merchant and the old man began to weep.\n\nThe old man with the two black dogs approached the genie and said to him, 'If I tell you what happened to me and these two dogs, and you find my story more strange and amazing than what happened to you with the merchant, will you release him?' The genie replied, 'Yes, I will.'",
    reviewPart: 2,
    questions: [
      { q: "ما معنى 'السلام عليكم'؟", qEn: "What does 'As-salamu alaykum' mean?", a: "Peace be upon you", options: ["Hello", "Peace be upon you", "Good morning", "Welcome"], optionsEn: ["Hello", "Peace be upon you", "Good morning", "Welcome"] },
      { q: "كيف تقول 'Good morning' بالعربية؟", qEn: "How do you say 'Good morning' in Arabic?", a: "صباح الخير", options: ["مساء الخير", "صباح الخير", "أهلاً وسهلاً", "كيف حالك"], optionsEn: ["Good evening", "Good morning", "Welcome", "How are you"] },
      { q: "الرد على 'كيف حالك؟' هو:", qEn: "The response to 'How are you?' is:", a: "بخير، والحمد لله", options: ["أهلاً بك", "بخير، والحمد لله", "وعليكم السلام", "تفضل"], optionsEn: ["Welcome", "Fine, thank God", "Peace be upon you", "Please"] },
      { q: "ماذا تقول عندما تقابل شخصاً لأول مرة؟", qEn: "What do you say when you meet someone for the first time?", a: "تشرفنا", options: ["مع السلامة", "تشرفنا", "عفواً", "شكراً"], optionsEn: ["Goodbye", "Nice to meet you", "Excuse me", "Thanks"] },
      { q: "كلمة 'مرحباً' تعني:", qEn: "The word 'Marhaban' means:", a: "Welcome", options: ["Goodbye", "Welcome", "Sorry", "Please"], optionsEn: ["Goodbye", "Welcome", "Sorry", "Please"] }
    ]
  },
  {
    title: "الليلة الثالثة: قصة الأخوة الثلاثة (تتمة)",
    titleEn: "Night 3: The Story of the Three Brothers (Continued)",
    content: "بدأ الرجل العجوز صاحب الكلبين الأسودين يروي قصته للجني، فقال: «اعلم يا سيد الجان، أن هذين الكلبين هما في الحقيقة أخواي. فعندما توفي والدي، ترك لنا نحن الثلاثة ثلاثة آلاف دينار، ففتح كل منا متجراً. وبعد فترة، قرر أخي الأكبر السفر للتجارة، فباع بضاعته بألف دينار وغادر. وبعد مرور عام، عاد وهو لا يملك شيئاً، فسألته: «أين ذهبت أموالك؟» فأجاب: «لقد خسرت كل شيء.» فحزنت عليه وشاركته متجري وأعطيته ألف دينار.\n\nوبعد فترة، قرر أخي الثاني السفر أيضاً، ففعل مثل أخي الأكبر. وبعد عام، عاد فقيراً، فأعطيته ألف دينار وشاركته متجري. وبعد مرور عدة سنوات، أراد أخواي السفر مرة أخرى، فرفضت في البداية، ولكنهما ألحا عليّ حتى وافقت. فبعنا بضاعتنا، وجمعنا ستة آلاف دينار، وضعنا نصفها في الأرض للذكرى، وأخذنا النصف الآخر معنا في رحلتنا البحرية.»",
    contentEn: "The old man with the two black dogs began telling his story to the genie, saying, 'Know, O master of the jinn, that these two dogs are actually my brothers. When my father died, he left the three of us three thousand dinars, so each of us opened a shop. After some time, my eldest brother decided to travel for trade, so he sold his goods for a thousand dinars and left. After a year, he returned with nothing. I asked him, \"Where did your money go?\" He replied, \"I lost everything.\" I felt sorry for him, shared my shop with him, and gave him a thousand dinars.\n\nAfter some time, my second brother also decided to travel, and he did just like the eldest brother. After a year, he returned poor, so I gave him a thousand dinars and shared my shop with him. After several years passed, my two brothers wanted to travel again. I refused at first, but they insisted until I agreed. So we sold our goods, collected six thousand dinars, buried half of it in the ground for safekeeping, and took the other half with us on our sea voyage.'",
    reviewPart: 2,
    questions: [
      { q: "ما هو الحرف الذي يبدأ به اسم 'جني'؟", qEn: "What letter does the word 'Jinni' start with?", a: "ج", options: ["ح", "ج", "خ", "ع"], optionsEn: ["H", "J", "Kh", "A"] },
      { q: "كلمة 'سيف' تنتهي بحرف:", qEn: "The word 'Sayf' (sword) ends with the letter:", a: "ف", options: ["ق", "ف", "ك", "ل"], optionsEn: ["Q", "F", "K", "L"] },
      { q: "ما هو الحرف الثاني في كلمة 'تراب'؟", qEn: "What is the second letter in the word 'Turab' (dust)?", a: "ر", options: ["ت", "ر", "ا", "ب"], optionsEn: ["T", "R", "A", "B"] },
      { q: "كلمة 'موت' تبدأ بحرف:", qEn: "The word 'Mawt' (death) starts with the letter:", a: "م", options: ["ن", "م", "ل", "ك"], optionsEn: ["N", "M", "L", "K"] },
      { q: "حرف 'التاء' في 'تأهب' هو حرف:", qEn: "The letter 'Ta' in 'Ta'ahhab' is a:", a: "مهموس", options: ["مجهور", "مهموس", "عنيد", "متصل"], optionsEn: ["Voiced", "Whispered", "Stubborn", "Connected"] }
    ]
  },
  {
    title: "الليلة الرابعة: الغيرة والانتقام",
    titleEn: "Night 4: Jealousy and Revenge",
    content: "«سافرنا بحراً لمدة شهر حتى وصلنا إلى مدينة، فبعنا بضاعتنا وربحنا الكثير من المال. وعندما كنا نستعد للرحيل، رأيت امرأة فقيرة ترتدي ملابس ممزقة، فاقتربت مني وقالت: «يا سيدي، هل تتزوجني وتأخذني معك إلى بلادك؟» فوافقت وأخذتها معي، وأحببتها كثيراً.\n\nولكن أخويّ شعرا بالغيرة مني ومن زوجتي، فقررا قتلي. وفي إحدى الليالي بينما كنا نائمين على السفينة، حملاني أنا وزوجتي وألقيا بنا في البحر. وعندما استيقظت زوجتي، تحولت فجأة إلى جنية، وحملتني حتى أوصلتني إلى جزيرة. وقالت لي: «أنا جنية، وقد أحببتك لصدقك، ولذلك أنقذتك من الغرق. أما أخواك، فسوف أغرقهما.» فتوسلت إليها ألا تفعل ذلك، وقلت لها: «هما أخواي على أي حال.»»",
    contentEn: "'We traveled by sea for a month until we reached a city, where we sold our goods and made a lot of money. As we were preparing to leave, I saw a poor woman wearing torn clothes. She approached me and said, \"Sir, will you marry me and take me with you to your country?\" I agreed and took her with me, and I loved her very much.\n\nBut my two brothers felt jealous of me and my wife, so they decided to kill me. One night while we were sleeping on the ship, they carried me and my wife and threw us into the sea. When my wife woke up, she suddenly transformed into a genie and carried me until she brought me to an island. She said to me, \"I am a genie, and I loved you for your honesty, so I saved you from drowning. As for your brothers, I will drown them.\" I begged her not to do that, saying, \"They are my brothers after all.\"' ",
    reviewPart: 2,
    questions: [
      { q: "ما هو الحرف الذي يبدأ به اسم 'أخ'؟", qEn: "What letter does the word 'Akh' (brother) start with?", a: "أ", options: ["ب", "أ", "ت", "ث"], optionsEn: ["B", "A", "T", "Th"] },
      { q: "كلمة 'متجر' تنتهي بحرف:", qEn: "The word 'Matjar' (shop) ends with the letter:", a: "ر", options: ["د", "ر", "ز", "و"], optionsEn: ["D", "R", "Z", "W"] },
      { q: "ما هو الحرف الأوسط في كلمة 'باع'؟", qEn: "What is the middle letter in the word 'Ba'a' (sold)?", a: "ا", options: ["ب", "ا", "ع", "ي"], optionsEn: ["B", "A", "Ayn", "Y"] },
      { q: "كلمة 'سفر' تبدأ بحرف:", qEn: "The word 'Safar' (travel) starts with the letter:", a: "س", options: ["ش", "س", "ص", "ض"], optionsEn: ["Sh", "S", "S (Sad)", "D (Dad)"] },
      { q: "كم عدد حروف كلمة 'ألف'؟", qEn: "How many letters are in the word 'Alf' (thousand)?", a: "3", options: ["2", "3", "4", "5"], optionsEn: ["2", "3", "4", "5"] }
    ]
  },
  {
    title: "الليلة الخامسة: سحر الجنية",
    titleEn: "Night 5: The Genie's Magic",
    content: "«حملتني الجنية وعدنا إلى منزلي، حيث وجدت المال الذي خبأته في الأرض. وعندما فتحت متجري، جاء إليّ أخواي وهما على شكل هذين الكلبين الأسودين. فقالت لي الجنية: «لقد حولتهما إلى كلبين، وسيبقيان هكذا لمدة عشر سنوات.» والآن، لقد مرت عشر سنوات، وأنا في طريقي إليهما لأعيدهما إلى حالتهما الطبيعية. فبينما كنت في طريقي، رأيت هذا التاجر، فأردت معرفة ما سيحدث له.»\n\nاندهش الجني من القصة، وقال: «إنها حقاً قصة عجيبة، ولقد وهبتك ثلث دم التاجر.» ثم اقترب رجل عجوز آخر كان يقود بغلة، وقال للجني: «سأحكي لك قصتي مع هذه البغلة، فإذا كانت أكثر غرابة من قصة هذا الرجل، فهل ستعطيني الثلث الثاني من دم التاجر؟» فأجاب الجني: «نعم.»",
    contentEn: "'The genie carried me and we returned to my home, where I found the money I had hidden in the ground. When I opened my shop, my two brothers came to me in the form of these two black dogs. The genie said to me, \"I have turned them into dogs, and they will remain so for ten years.\" Now, ten years have passed, and I am on my way to them to return them to their natural state. While I was on my way, I saw this merchant and wanted to know what would happen to him.'\n\nThe genie was amazed by the story and said, 'It is indeed a wonderful story, and I have granted you a third of the merchant's blood.' Then another old man leading a mule approached and said to the genie, 'I will tell you my story with this mule, and if it is more strange than this man's story, will you give me the second third of the merchant's blood?' The genie replied, 'Yes.'",
    reviewPart: 2,
    questions: [
      { q: "كلمة 'بحر' تبدأ بحرف:", qEn: "The word 'Bahr' (sea) starts with the letter:", a: "ب", options: ["ت", "ب", "ي", "ن"], optionsEn: ["T", "B", "Y", "N"] },
      { q: "ما هو الحرف الأخير في 'مدينة'؟", qEn: "What is the last letter in 'Madinah' (city)?", a: "ة", options: ["ا", "ة", "ت", "ه"], optionsEn: ["A", "Ta Marbuta", "T", "H"] },
      { q: "كلمة 'امرأة' تبدأ بحرف:", qEn: "The word 'Imra'ah' (woman) starts with the letter:", a: "ا", options: ["أ", "ا", "إ", "آ"], optionsEn: ["A (Hamza)", "Alif", "I (Hamza below)", "A (Madda)"] },
      { q: "ما هو الحرف الثاني في 'سفينة'؟", qEn: "What is the second letter in 'Safinah' (ship)?", a: "ف", options: ["س", "ف", "ي", "ن"], optionsEn: ["S", "F", "Y", "N"] },
      { q: "كلمة 'جزيرة' تنتهي بـ:", qEn: "The word 'Jazirah' (island) ends with:", a: "تاء مربوطة", options: ["تاء مفتوحة", "هاء", "تاء مربوطة", "ألف"], optionsEn: ["Open Ta", "Ha", "Ta Marbuta", "Alif"] }
    ]
  },
  {
    title: "الليلة السادسة: قصة الزوجة المسحورة",
    titleEn: "Night 6: The Story of the Enchanted Wife",
    content: "بدأ الرجل العجوز صاحب البغلة يروي قصته للجني، فقال: «اعلم يا سيد الجان، أن هذه البغلة هي في الحقيقة زوجتي. فذات يوم، سافرت للتجارة وغبت لمدة عام، وعندما عدت إلى منزلي في الليل، وجدت زوجتي مع رجل غريب. وعندما رأتني، قامت بسحري وحولتني إلى كلب وطردتني من المنزل.\n\nذهبت إلى دكان جزار، وعندما رأتني ابنته، عرفت أنني مسحور، فقامت برش الماء عليّ وقالت: «اخرج من هذه الصورة إلى صورتك الأصلية.» فعدت إنساناً كما كنت. ثم سألتها: «كيف يمكنني الانتقام من زوجتي؟» فأعطتني قليلاً من الماء المسحور وقالت: «رشه عليها وسوف تتحول إلى أي حيوان تريده.» فذهبت إلى زوجتي ورششت الماء عليها، فتحولت إلى هذه البغلة التي تراها الآن.»",
    contentEn: "The old man with the mule began telling his story to the genie, saying, 'Know, O master of the jinn, that this mule is actually my wife. One day, I traveled for trade and was away for a year. When I returned home at night, I found my wife with a strange man. When she saw me, she bewitched me and turned me into a dog and drove me out of the house.\n\nI went to a butcher's shop, and when his daughter saw me, she knew I was bewitched. She sprinkled water on me and said, \"Come out of this form into your original form.\" So I became human again as I was. Then I asked her, \"How can I take revenge on my wife?\" She gave me a little enchanted water and said, \"Sprinkle it on her and she will turn into any animal you want.\" So I went to my wife and sprinkled the water on her, and she turned into this mule you see now.'",
    reviewPart: 3,
    questions: [
      { q: "ما هو يوم 'Tuesday'؟", qEn: "What is 'Tuesday'?", a: "الثلاثاء", options: ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس"], optionsEn: ["Monday", "Tuesday", "Wednesday", "Thursday"] },
      { q: "يوم 'Thursday' هو:", qEn: "'Thursday' is:", a: "الخميس", options: ["الأربعاء", "الخميس", "الجمعة", "السبت"], optionsEn: ["Wednesday", "Thursday", "Friday", "Saturday"] },
      { q: "ما هو أول يوم في الأسبوع في معظم الدول العربية؟", qEn: "What is the first day of the week in most Arab countries?", a: "الأحد", options: ["السبت", "الأحد", "الاثنين", "الجمعة"], optionsEn: ["Saturday", "Sunday", "Monday", "Friday"] },
      { q: "كلمة 'يوم' تعني:", qEn: "The word 'Yawm' means:", a: "Day", options: ["Night", "Day", "Morning", "Evening"], optionsEn: ["Night", "Day", "Morning", "Evening"] },
      { q: "ما هو اليوم الذي يسبق الجمعة؟", qEn: "What day precedes Friday?", a: "الخميس", options: ["الأربعاء", "الخميس", "السبت", "الثلاثاء"], optionsEn: ["Wednesday", "Thursday", "Saturday", "Tuesday"] }
    ]
  },
  {
    title: "الليلة السابعة: نجاة التاجر",
    titleEn: "Night 7: The Merchant's Survival",
    content: "اندهش الجني من القصة، وقال: «إنها حقاً قصة عجيبة، ولقد وهبتك الثلث الثاني من دم التاجر.» ثم اقترب الرجل العجوز الثالث، وقال للجني: «سأحكي لك قصتي، فإذا كانت أكثر غرابة من القصتين السابقتين، فهل ستعطيني الثلث الأخير من دم التاجر؟» فأجاب الجني: «نعم.»\n\nحكى الرجل العجوز الثالث قصته للجني، وعندما انتهى، قال الجني: «لقد وهبتك الثلث الأخير من دم التاجر.» ففرح التاجر كثيراً، وشكر الرجال الثلاثة، وعاد إلى منزله وأسرته بسلام.\n\nوهنا أدرك شهرزاد الصباح، فسكتت عن الكلام المباح. فقالت لها دينارزاد: «يا لها من قصة رائعة!» فردت شهرزاد: «ليلة غد، سأحكي لكما قصة الصياد، وهي أكثر إثارة وتشويقاً.»",
    contentEn: "The genie was amazed by the story and said, 'It is indeed a wonderful story, and I have granted you the second third of the merchant's blood.' Then the third old man approached and said to the genie, 'I will tell you my story, and if it is more strange than the previous two stories, will you give me the last third of the merchant's blood?' The genie replied, 'Yes.'\n\nThe third old man told his story to the genie, and when he finished, the genie said, 'I have granted you the last third of the merchant's blood.' The merchant was very happy, thanked the three men, and returned to his home and family in peace.\n\nAt this point, Scheherazade perceived the dawn and fell silent from her permitted speech. Dunyazad said to her, 'What a wonderful story!' Scheherazade replied, 'Tomorrow night, I will tell you the story of the fisherman, and it is even more exciting and suspenseful.'",
    reviewPart: 3,
    questions: [
      { q: "ما هو يوم 'Wednesday'؟", qEn: "What is 'Wednesday'?", a: "الأربعاء", options: ["الثلاثاء", "الأربعاء", "الخميس", "الجمعة"], optionsEn: ["Tuesday", "Wednesday", "Thursday", "Friday"] },
      { q: "يوم 'Saturday' هو:", qEn: "'Saturday' is:", a: "السبت", options: ["الجمعة", "السبت", "الأحد", "الاثنين"], optionsEn: ["Friday", "Saturday", "Sunday", "Monday"] },
      { q: "ما هو اليوم الذي يأتي بعد الثلاثاء؟", qEn: "What day comes after Tuesday?", a: "الأربعاء", options: ["الاثنين", "الأربعاء", "الخميس", "السبت"], optionsEn: ["Monday", "Wednesday", "Thursday", "Saturday"] },
      { q: "كلمة 'غداً' تعني:", qEn: "The word 'Ghadan' means:", a: "Tomorrow", options: ["Today", "Yesterday", "Tomorrow", "Now"], optionsEn: ["Today", "Yesterday", "Tomorrow", "Now"] },
      { q: "كلمة 'أمس' تعني:", qEn: "The word 'Ams' means:", a: "Yesterday", options: ["Today", "Yesterday", "Tomorrow", "Now"], optionsEn: ["Today", "Yesterday", "Tomorrow", "Now"] }
    ]
  },
  {
    title: "الليلة الثامنة: الصياد والشبكة",
    titleEn: "Night 8: The Fisherman and the Net",
    content: "في الليلة التالية، قالت دينارزاد لأختها: «رجاءً يا أختاه، إذا لم يكن النوم يغالبك، فاروي لنا واحدة من قصصك الممتعة.» فأجابت شهرزاد: «بكل سرور.»\n\nبلغني — أيها الملك السعيد — أنه كان هناك صياد طاعن في السن، وكان فقيراً جداً وله زوجة وثلاثة أبناء. وكان من عادته أن يرمي شبكته في البحر أربع مرات فقط كل يوم. وفي أحد الأيام، ذهب إلى البحر عند الظهر، ورمى شبكته، وعندما سحبها وجدها ثقيلة جداً، ففرح وظن أنها مليئة بالأسماك. ولكنه عندما فتحها، وجد فيها حماراً ميتاً، فحزن الصياد كثيراً وقال: «لا حول ولا قوة إلا بالله.»",
    contentEn: "The following night, Dunyazad said to her sister, 'Please, sister, if sleep does not overcome you, tell us one of your enjoyable stories.' Scheherazade replied, 'With pleasure.'\n\nIt has reached me, O happy King, that there was an elderly fisherman who was very poor and had a wife and three sons. It was his habit to cast his net into the sea only four times each day. One day, he went to the sea at noon and cast his net. When he pulled it in, he found it very heavy, so he was happy and thought it was full of fish. But when he opened it, he found a dead donkey in it. The fisherman was very sad and said, 'There is no power nor strength except in God.'",
    reviewPart: 4,
    questions: [
      { q: "كيف تقول 'Who' بالعربية؟", qEn: "How do you say 'Who' in Arabic?", a: "من", options: ["ما", "من", "أين", "كيف"], optionsEn: ["Ma", "Man", "Ayna", "Kayfa"] },
      { q: "أداة الاستفهام 'أين' تسأل عن:", qEn: "The interrogative 'Ayna' asks about:", a: "المكان", options: ["الزمان", "المكان", "الحال", "السبب"], optionsEn: ["Time", "Place", "State", "Reason"] },
      { q: "كيف تسأل عن الحال؟", qEn: "How do you ask about the state/condition?", a: "كيف", options: ["ما", "لماذا", "كيف", "متى"], optionsEn: ["Ma", "Limadha", "Kayfa", "Mata"] },
      { q: "أداة الاستفهام 'متى' تسأل عن:", qEn: "The interrogative 'Mata' asks about:", a: "الزمان", options: ["الزمان", "المكان", "العدد", "السبب"], optionsEn: ["Time", "Place", "Number", "Reason"] },
      { q: "كيف تسأل عن السبب؟", qEn: "How do you ask about the reason?", a: "لماذا", options: ["ماذا", "لماذا", "كيف", "كم"], optionsEn: ["Madha", "Limadha", "Kayfa", "Kam"] }
    ]
  },
  {
    title: "الليلة التاسعة: خيبة أمل الصياد",
    titleEn: "Night 9: The Fisherman's Disappointment",
    content: "ثم رمى الصياد شبكته للمرة الثانية، وعندما سحبها وجدها ثقيلة جداً أيضاً، فظن أنها مليئة بالأسماك الكبيرة. ولكنه عندما فتحها، وجد فيها جرة كبيرة مليئة بالوحل والرمال، فحزن الصياد أكثر وقال: «يا رب، أنت تعلم أنني أرمي شبكتي أربع مرات فقط، وقد ضاعت مرتان.»\n\nثم رمى شبكته للمرة الثالثة، فخرجت مليئة بقطع الزجاج والخزف المكسور. فرفع الصياد رأسه إلى السماء وقال: «اللهم إنك تعلم أنني لا أرمي شبكتي إلا أربع مرات، وقد رميتها ثلاثاً ولم يخرج لي شيء.»",
    contentEn: "Then the fisherman cast his net for the second time. When he pulled it in, he found it very heavy too, so he thought it was full of large fish. But when he opened it, he found a large jar full of mud and sand. The fisherman became even sadder and said, 'O Lord, You know that I cast my net only four times, and two times have been wasted.'\n\nThen he cast his net for the third time, and it came out full of pieces of glass and broken pottery. The fisherman raised his head to the sky and said, 'O God, You know that I do not cast my net except four times, and I have cast it three times and nothing has come out for me.'",
    reviewPart: 4,
    questions: [
      { q: "كيف تقول 'What' لغير العاقل؟", qEn: "How do you say 'What' for non-humans?", a: "ما / ماذا", options: ["من", "ما / ماذا", "أين", "متى"], optionsEn: ["Man", "Ma / Madha", "Ayna", "Mata"] },
      { q: "أداة الاستفهام 'كم' تسأل عن:", qEn: "The interrogative 'Kam' asks about:", a: "العدد", options: ["العدد", "الحال", "الزمان", "المكان"], optionsEn: ["Number", "State", "Time", "Place"] },
      { q: "كيف تسأل 'Is / Are' (نعم أو لا)؟", qEn: "How do you ask 'Is / Are' (Yes/No)?", a: "هل", options: ["ما", "هل", "من", "أين"], optionsEn: ["Ma", "Hal", "Man", "Ayna"] },
      { q: "ماذا تستخدم للسؤال عن شيء غير معروف؟", qEn: "What do you use to ask about something unknown?", a: "ماذا", options: ["من", "ماذا", "كيف", "متى"], optionsEn: ["Man", "Madha", "Kayfa", "Mata"] },
      { q: "أداة 'كيف' تستخدم للسؤال عن:", qEn: "The tool 'Kayfa' is used to ask about:", a: "الطريقة أو الحال", options: ["المكان", "الزمان", "الطريقة أو الحال", "العدد"], optionsEn: ["Place", "Time", "Method or State", "Number"] }
    ]
  },
  {
    title: "الليلة العاشرة: القمقم والنحاس",
    titleEn: "Night 10: The Jar and the Copper",
    content: "ثم توضأ الصياد وصلى ركعتين، ورمى شبكته للمرة الرابعة والأخيرة، ودعا الله أن يرزقه. وعندما سحب الشبكة، وجدها ثقيلة جداً، فبذل جهداً كبيراً حتى أخرجها. فوجد فيها قمقماً (وعاءً) من النحاس الأصفر، مسدوداً بسدادة من الرصاص عليها ختم الملك سليمان.\n\nفرح الصياد وقال: «سأبيع هذا القمقم في سوق النحاس، فهو يساوي عشرة دنانير ذهبية.» ثم حاول الصياد فتح القمقم، فهزه فوجده ثقيلاً، فاستخدم سكينه وفتح سدادة الرصاص. فخرج من القمقم دخان كثيف صعد إلى السماء، ثم تجمع الدخان وتكون منه جني مرعب وعظيم.",
    contentEn: "Then the fisherman performed ablution and prayed two rak'ahs, and cast his net for the fourth and final time, praying to God to provide for him. When he pulled in the net, he found it very heavy, so he exerted a great effort until he brought it out. He found in it a copper jar (flask), sealed with a lead stopper bearing the seal of King Solomon.\n\nThe fisherman was happy and said, 'I will sell this jar in the copper market; it is worth ten golden dinars.' Then the fisherman tried to open the jar. He shook it and found it heavy, so he used his knife and opened the lead stopper. Thick smoke came out of the jar and rose to the sky, then the smoke gathered and formed a terrifying and great genie.",
    reviewPart: 4,
    questions: [
      { q: "كيف تسأل عن مكان السكن؟", qEn: "How do you ask about the place of residence?", a: "أين تسكن؟", options: ["من أنت؟", "أين تسكن؟", "متى تسافر؟", "كيف حالك؟"], optionsEn: ["Who are you?", "Where do you live?", "When do you travel?", "How are you?"] },
      { q: "كيف تسأل عن الوقت؟", qEn: "How do you ask about the time?", a: "كم الساعة؟", options: ["ما اسمك؟", "كم الساعة؟", "أين تذهب؟", "لماذا تبكي؟"], optionsEn: ["What is your name?", "What time is it?", "Where are you going?", "Why are you crying?"] },
      { q: "للسؤال عن شخص ما نستخدم:", qEn: "To ask about a person, we use:", a: "من", options: ["ما", "من", "أين", "هل"], optionsEn: ["Ma", "Man", "Ayna", "Hal"] },
      { q: "للسؤال عن سعر شيء ما نستخدم:", qEn: "To ask about the price of something, we use:", a: "بكم", options: ["بكم", "متى", "لماذا", "من"], optionsEn: ["Bikam", "Mata", "Limadha", "Man"] },
      { q: "كيف تسأل عن الصحة؟", qEn: "How do you ask about health?", a: "كيف حالك؟", options: ["ماذا تفعل؟", "أين أنت؟", "كيف حالك؟", "من هذا؟"], optionsEn: ["What are you doing?", "Where are you?", "How are you?", "Who is this?"] }
    ]
  },
  {
    title: "الليلة الحادية عشرة: قصة الجني",
    titleEn: "Night 11: The Genie's Story",
    content: "عندما رأى الجني الصياد، صرخ وقال: «لا إله إلا الله، سليمان نبي الله!» ثم قال للصياد: «يا نبي الله، لا تقتلني، فأنا لن أعصي لك أمراً أبداً.» فضحك الصياد وقال: «يا جني، هل تقول سليمان نبي الله؟ إن سليمان قد مات منذ ألف وثمانمائة عام! فمن أنت؟ وكيف دخلت في هذا القمقم؟»\n\nغضب الجني وقال للصياد: «أبشر يا صياد بموتك في هذه الساعة!» فتعجب الصياد وقال: «لماذا تقتلني وأنا الذي أنقذتك من سجنك في قاع البحر؟» فقال الجني: «اسمع قصتي يا صياد.»",
    contentEn: "When the genie saw the fisherman, he shouted and said, 'There is no god but God, Solomon is the Prophet of God!' Then he said to the fisherman, 'O Prophet of God, do not kill me, for I will never disobey any command of yours.' The fisherman laughed and said, 'O genie, do you say Solomon is the Prophet of God? Solomon has been dead for one thousand eight hundred years! So who are you? And how did you get into this jar?'\n\nThe genie became angry and said to the fisherman, 'Rejoice, O fisherman, in your death at this hour!' The fisherman was amazed and said, 'Why do you kill me when I am the one who saved you from your prison at the bottom of the sea?' The genie said, 'Listen to my story, O fisherman.'",
    reviewPart: 4,
    questions: [
      { q: "كيف تقول 'I am' بالعربية؟", qEn: "How do you say 'I am' in Arabic?", a: "أنا", options: ["أنا", "أنت", "هو", "هي"], optionsEn: ["Ana", "Anta", "Huwa", "Hiya"] },
      { q: "كيف تقول 'You' للمذكر؟", qEn: "How do you say 'You' (masculine)?", a: "أنتَ", options: ["أنتَ", "أنتِ", "نحن", "هم"], optionsEn: ["Anta", "Anti", "Nahnu", "Hum"] },
      { q: "كيف تقول 'He' بالعربية؟", qEn: "How do you say 'He' in Arabic?", a: "هو", options: ["هو", "هي", "أنا", "أنت"], optionsEn: ["Huwa", "Hiya", "Ana", "Anta"] },
      { q: "كيف تقول 'She' بالعربية؟", qEn: "How do you say 'She' in Arabic?", a: "هي", options: ["هو", "هي", "نحن", "أنت"], optionsEn: ["Huwa", "Hiya", "Nahnu", "Anta"] },
      { q: "كيف تقول 'We' بالعربية؟", qEn: "How do you say 'We' in Arabic?", a: "نحن", options: ["أنا", "نحن", "أنت", "هم"], optionsEn: ["Ana", "Nahnu", "Anta", "Hum"] }
    ]
  },
  {
    title: "الليلة الثانية عشرة: عفو العفريت",
    titleEn: "Night 12: The Genie's Pardon",
    content: "لما سمع العفريت حكايات الشيوخ الثلاثة، ورأى صدق التاجر ووفاءه بعهده رغم خوفه الشديد من الموت واقتراب السيف من عنقه، رق قلبه القاسي وعفا عنه عفو الملوك. قال العفريت بصوت هادئ هذه المرة: يا شيوخ، قد وهبتكم دمه إكراماً لحكاياتكم العجيبة التي لم أسمع مثلها قط، ووفاء هذا التاجر بكلمته التي عاهدني بها رغم أنه كان قادراً على الهرب، ولكنه اختار الصدق والوفاء. ففرح التاجر فرحاً شديداً لا يوصف، وسجد لله شكراً، وقبل أيدي الشيوخ الثلاثة الذين أنقذوا حياته بفضل قصصهم المشوقة وحضورهم في الوقت المناسب. ثم ودعهم بدموع الفرح وعاد إلى أهله وبلاده سالماً غانماً، وعاش معهم في سعادة وهناء بعد أن تعلم درساً عظيماً في الوفاء بالعهود وأهمية الصدق. وهذه يا ملك الزمان ليست أعجب من حكاية الصياد والعفريت! فقال الملك شهريار في نفسه: والله لا أقتلها حتى أسمع بقية حكاية الصياد، فإنها حكاية عجيبة ومشوقة، وقد بدأت الشمس تشرق، فسكتت شهرزاد عن الكلام المباح وهي تبتسم سراً لنجاح خطتها.",
    contentEn: "When the genie heard the stories of the three old men and saw the merchant's honesty and fulfillment of his promise despite his intense fear of death and the sword's proximity to his neck, his hard heart softened and he pardoned him with the pardon of kings. The genie said, in a calm voice this time: 'O old men, I have granted you his life in honor of your amazing stories, the likes of which I have never heard, and this merchant's loyalty to the word he gave me, even though he was able to escape, but he chose honesty and loyalty.' The merchant was indescribably overjoyed; he prostrated in thanks to God and kissed the hands of the three old men who saved his life through their exciting stories and timely presence. Then he bid them farewell with tears of joy and returned to his family and country safe and sound, living with them in happiness and bliss after learning a great lesson in keeping promises and the importance of honesty. 'And this, O King of the Age, is not more amazing than the story of the Fisherman and the Genie!' King Shahryar said to himself: 'By God, I will not kill her until I hear the rest of the Fisherman's story, for it is a wonderful and exciting tale.' As the sun began to rise, Scheherazade fell silent from her permitted speech, smiling secretly at the success of her plan.'",
    reviewPart: 5,
    questions: [
      { q: "ما هو الرقم '1'؟", qEn: "What is the number '1'?", a: "واحد", options: ["واحد", "اثنان", "ثلاثة", "أربعة"], optionsEn: ["One", "Two", "Three", "Four"] },
      { q: "الرقم '3' هو:", qEn: "The number '3' is:", a: "ثلاثة", options: ["اثنان", "ثلاثة", "أربعة", "خمسة"], optionsEn: ["Two", "Three", "Four", "Five"] },
      { q: "كيف تقول 'Number' بالعربية؟", qEn: "How do you say 'Number' in Arabic?", a: "رقم", options: ["كلمة", "رقم", "حرف", "جملة"], optionsEn: ["Word", "Number", "Letter", "Sentence"] },
      { q: "الرقم '8' هو:", qEn: "The number '8' is:", a: "ثمانية", options: ["سبعة", "ثمانية", "تسعة", "عشرة"], optionsEn: ["Seven", "Eight", "Nine", "Ten"] },
      { q: "الرقم '4' هو:", qEn: "The number '4' is:", a: "أربعة", options: ["ثلاثة", "أربعة", "خمسة", "ستة"], optionsEn: ["Three", "Four", "Five", "Six"] }
    ]
  },
  {
    title: "الليلة الثالثة عشرة: شهرزاد وشهريار",
    titleEn: "Night 13: Scheherazade and Shahryar",
    content: "كانت شهرزاد ابنة الوزير ذكية وحكيمة، وقد قرأت آلاف الكتب والتواريخ وسير الملوك الماضين، وحفظت أشعار الشعراء وأخبار الأمم. فلما تزوجها الملك شهريار، بدأت تحكي له القصص المشوقة التي تجذب الألباب وتأخذ بالقلوب، فإذا طلع الفجر سكتت عن الكلام المباح وهي في قمة التشويق، فيقول الملك في نفسه: ما أحلى حديثك وأعجب قصصك! والله لا أقتلها حتى أسمع نهاية القصة. فتقول شهرزاد بذكاء: وهذا لا يساوي شيئاً أمام ما سأحكيه لك الليلة القادمة إن عشت وأبقاني الملك السعيد، فإن فيها من العجائب ما لم تسمع به أذن. فيزداد الملك شوقاً ويؤجل قتلها ليلة بعد ليلة. وهكذا استمرت شهرزاد تحكي القصص، والملك ينصت إليها بكل جوارحه، حتى رزقت منه بالأولاد وتغير حاله من القسوة والظلم إلى الرحمة والعدل، وعم الأمان والرخاء في كل أرجاء البلاد بفضل حكمة شهرزاد وصبرها وعلمها الواسع.",
    contentEn: "Scheherazade, the Vizier's daughter, was intelligent and wise, having read thousands of books, histories, and the biographies of past kings, and memorized the verses of poets and the chronicles of nations. When King Shahryar married her, she began to tell him exciting stories that captured the mind and moved the heart. When dawn broke, she would stop talking at the height of the suspense, and the King would say to himself: 'How sweet is your talk and how wonderful are your stories! By God, I will not kill her until I hear the end of the story.' Scheherazade would cleverly reply: 'This is nothing compared to what I will tell you next night, if I live and the happy King spares me, for it contains wonders such as no ear has ever heard.' The King's longing would increase, and he would postpone her execution night after night. Thus Scheherazade continued to tell stories, and the King listened with all his senses, until she bore him children and his state changed from cruelty and injustice to mercy and justice, and peace and prosperity prevailed throughout the land thanks to Scheherazade's wisdom, patience, and vast knowledge.'",
    reviewPart: 5,
    questions: [
      { q: "الرقم '2' هو:", qEn: "The number '2' is:", a: "اثنان", options: ["واحد", "اثنان", "ثلاثة", "أربعة"], optionsEn: ["One", "Two", "Three", "Four"] },
      { q: "الرقم '6' هو:", qEn: "The number '6' is:", a: "ستة", options: ["خمسة", "ستة", "سبعة", "ثمانية"], optionsEn: ["Five", "Six", "Seven", "Eight"] },
      { q: "الرقم '9' هو:", qEn: "The number '9' is:", a: "تسعة", options: ["ثمانية", "تسعة", "عشرة", "واحد"], optionsEn: ["Eight", "Nine", "Ten", "One"] },
      { q: "كيف تقول 'First'؟", qEn: "How do you say 'First'?", a: "الأول", options: ["الثاني", "الأول", "الثالث", "الأخير"], optionsEn: ["Second", "First", "Third", "Last"] },
      { q: "كيف تقول 'Second'؟", qEn: "How do you say 'Second'?", a: "الثاني", options: ["الأول", "الثاني", "الثالث", "الرابع"], optionsEn: ["First", "Second", "Third", "Fourth"] }
    ]
  },
  {
    title: "الليلة الرابعة عشرة: الصياد والعفريت",
    titleEn: "Night 14: The Fisherman and the Genie",
    content: "بدأت شهرزاد حكايتها الجديدة قائلة: كان هناك صياد فقير طاعن في السن، له زوجة وثلاثة أولاد، وكان من عادته أن يرمي شبكته أربع مرات فقط في كل يوم طلباً للرزق الحلال. وفي يوم من الأيام، ذهب إلى شاطئ البحر ورمى شبكته، ففي المرة الأولى أخرج حماراً ميتاً فاستغفر الله، وفي الثانية جرة مملوءة بالرمل والطين، وفي الثالثة قوارير مكسورة وخزفاً قديماً. فلما رمى في المرة الرابعة والأخيرة، دعا الله بقلب خاشع وتوكل عليه، فخرجت الشبكة ثقيلة جداً حتى كادت تنقطع، ففرح الصياد وظن أنها سمكة كبيرة ستغنيه، ولكن وجد فيها قمقماً من نحاس أصفر مختوماً بختم سليمان بن داود عليهما السلام. ففرح الصياد وقال: سأبيعه في سوق النحاس بعشرة دنانير ذهبية وأشتري به طعاماً لأولادي. ثم أخرج سكيناً وفتح الختم، فخرج منه دخان كثيف صعد إلى السماء حتى حجب ضوء الشمس، ثم اجتمع الدخان فصار عفريتاً هائلاً مرعباً، قدماه في الأرض ورأسه في السحاب، وعيناه كالجمر المشتعل، فارتعدت فرائص الصياد وسقط على الأرض من هول المنظر وقال: يا نبي الله سليمان، لا تقتلني فإني تائب! فقال العفريت بصوت كالرعد يزلزل الجبال: لست سليمان، بل أنا مارد عصيته منذ مئات السنين فحبسني في هذا القمقم ورماني في أعماق البحر.",
    contentEn: "Scheherazade began her new tale, saying: 'There was a very old and poor fisherman who had a wife and three children, and it was his custom to cast his net only four times each day seeking lawful provision. One day, he went to the seashore and cast his net; the first time he brought up a dead donkey and asked God's forgiveness, the second a jar filled with sand and mud, and the third broken bottles and old pottery. When he cast it the fourth and final time, he prayed to God with a humble heart and relied on Him; the net came up very heavy, almost breaking. The fisherman rejoiced, thinking it was a large fish that would enrich him, but he found in it a yellow copper jar sealed with the seal of Solomon, son of David, peace be upon them. The fisherman rejoiced and said: \"I will sell this in the copper market for ten gold dinars and buy food for my children.\" Then he took a knife and opened the seal. Thick smoke rose to the sky until it obscured the sunlight, then the smoke gathered to become a huge, terrifying genie, his feet on the ground and his head in the clouds, his eyes like burning coals. The fisherman trembled and fell to the ground from the horror of the sight, saying: \"O Prophet Solomon, do not kill me, for I am repentant!\" The genie replied in a voice like thunder that shook the mountains: \"I am not Solomon; I am a giant who disobeyed him hundreds of years ago, so he imprisoned me in this jar and threw me into the depths of the sea.\"'",
    reviewPart: 6,
    questions: [
      { q: "كيف تقول 'I' بالعربية؟", qEn: "How do you say 'I' in Arabic?", a: "أنا", options: ["نحن", "أنا", "أنت", "هو"], optionsEn: ["We", "I", "You", "He"] },
      { q: "ضمير الغائب للمذكر المفرد هو:", qEn: "The third-person singular masculine pronoun is:", a: "هو", options: ["هي", "هو", "هما", "هم"], optionsEn: ["She", "He", "They (dual)", "They (plural)"] },
      { q: "كيف تقول 'You' للمذكر المفرد؟", qEn: "How do you say 'You' for singular masculine?", a: "أنتَ", options: ["أنتِ", "أنتَ", "أنتم", "أنتما"], optionsEn: ["You (fem.)", "You (masc.)", "You (plural)", "You (dual)"] },
      { q: "ضمير المتكلم للجمع هو:", qEn: "The first-person plural pronoun is:", a: "نحن", options: ["أنا", "نحن", "هم", "أنتم"], optionsEn: ["I", "We", "They", "You (plural)"] },
      { q: "كيف تقول 'She' بالعربية؟", qEn: "How do you say 'She' in Arabic?", a: "هي", options: ["هو", "هي", "هما", "هن"], optionsEn: ["He", "She", "They (dual)", "They (fem. plural)"] }
    ]
  },
  {
    title: "الليلة الخامسة عشرة: تهديد العفريت",
    titleEn: "Night 15: The Genie's Threat",
    content: "قال العفريت للصياد بغلظة وقسوة: أبشر يا صياد بقتلك في هذه الساعة! اختر أي ميتة تموتها، وأي قتلة أقتلك بها، فإني لا أتركك حياً أبداً! فصعق الصياد وارتجف قلبه وقال: يا عفريت، لقد أنقذتك من قاع البحر المظلم وأخرجتك من سجنك الضيق الذي لبثت فيه دهوراً، فهل هذا جزائي منك؟ هل تقابل الإحسان بالإساءة؟ قال العفريت: نعم، فاسمع قصتي لتعرف السبب. لقد حلفت يميناً في المائة سنة الأولى أن أغني من يخرجني حتى لا يحتاج لأحد، فلم يخرجني أحد. وفي المائة الثانية حلفت أن أفتح له كنوز الأرض وأجعله ملكاً، فلم يخرجني أحد. وفي المائة الثالثة غضبت غضباً شديداً وحلفت أن أقتل من يخرجني وأخيره في ميتته جزاءً لتأخره عني. ففكر الصياد في حيلة ذكية لينجو من الموت المحقق وقال: يا عفريت، أسألك بالله العظيم الذي ختم على هذا القمقم، هل كنت حقاً داخل هذا القمقم الصغير؟ إنه لا يسع حتى يدك أو رجلك، فكيف وسعك كلك وأنت بهذا الحجم الهائل؟ فغضب العفريت من شك الصياد وقال: أتشك في قولي؟ انظر كيف أدخل فيه الآن! ثم تحول إلى دخان كثيف ودخل في القمقم مرة أخرى ليثبت للصياد صدق كلامه.",
    contentEn: "The genie said to the fisherman with harshness and cruelty: 'Rejoice, O fisherman, for your death is at this hour! Choose how you wish to die, and what manner of death I shall inflict upon you, for I will never leave you alive!' The fisherman was shocked, his heart trembling, and said: 'O genie, I saved you from the dark bottom of the sea and brought you out of your narrow prison where you stayed for ages; is this my reward from you? Do you meet goodness with evil?' The genie replied: 'Yes, so hear my story to know the reason. I swore an oath in the first hundred years to enrich whoever brings me out so he would never need anyone, but no one did. In the second hundred, I swore to open the treasures of the earth for him and make him a king, but no one did. In the third hundred, I grew very angry and swore to kill whoever brings me out and let him choose his death as a reward for delaying my release.' The fisherman thought of a clever trick to survive certain death and said: 'O genie, I ask you by the Great God who sealed this jar, were you truly inside this small jar? It wouldn't even fit your hand or foot, so how did it fit all of you when you are of this immense size?' The genie grew angry at the fisherman's doubt and said: 'Do you doubt my word? Look how I enter it now!' Then he turned into thick smoke and entered the jar again to prove his words to the fisherman.'",
    reviewPart: 6,
    questions: [
      { q: "كيف تقول 'You' للمؤنث المفرد؟", qEn: "How do you say 'You' for singular feminine?", a: "أنتِ", options: ["أنتَ", "أنتِ", "أنتما", "أنتم"], optionsEn: ["You (masc.)", "You (fem.)", "You (dual)", "You (plural)"] },
      { q: "ضمير الغائب للجمع المذكر هو:", qEn: "The third-person plural masculine pronoun is:", a: "هم", options: ["هن", "هم", "هما", "هي"], optionsEn: ["They (fem.)", "They (masc.)", "They (dual)", "She"] },
      { q: "كيف تقول 'They' للمؤنث؟", qEn: "How do you say 'They' for feminine?", a: "هن", options: ["هم", "هن", "هما", "هو"], optionsEn: ["They (masc.)", "They (fem.)", "They (dual)", "He"] },
      { q: "ضمير المخاطب للجمع (مذكر) هو:", qEn: "The second-person plural masculine pronoun is:", a: "أنتم", options: ["أنتن", "أنتم", "أنتما", "أنت"], optionsEn: ["You (fem. plural)", "You (masc. plural)", "You (dual)", "You (singular)"] },
      { q: "كيف تقول 'Both of you'؟", qEn: "How do you say 'Both of you'?", a: "أنتما", options: ["أنتم", "أنتما", "أنتن", "أنا"], optionsEn: ["You (plural)", "You (dual)", "You (fem. plural)", "I"] }
    ]
  },
  {
    title: "الليلة السادسة عشرة: حيلة الصياد",
    titleEn: "Night 16: The Fisherman's Trick",
    content: "بمجرد أن دخل العفريت بكامله داخل القمقم، سارع الصياد بذكاء وسرعة البرق وأخذ السدادة الرصاصية المختومة بختم سليمان وأغلق بها فوهة القمقم بإحكام شديد. فصاح العفريت من الداخل بصوت مكتوم يملؤه الرعب: يا صياد، افتح لي وسأعطيك كنوزاً لا تنفد وأجعلك أغنى ملوك الأرض! فقال الصياد بلهجة المنتصر: كذبت يا لعين، سأرميك الآن في أعماق البحر المظلم وأبني لي بيتاً هنا وأحذر كل الصيادين منك ومن غدرك، وسأكتب على الشاطئ: هنا يرقد عفريت غادر لا يفي بالعهود. فبدأ العفريت يتوسل ويبكي ويحلف بأغلظ الأيمان وأقدسها أنه لن يؤذيه أبداً، بل سيعلمه سراً عظيماً يجعله أغنى أهل زمانه ويوصله إلى سعادة لا تنتهي. فصدقه الصياد بعد أن أخذ عليه العهود والمواثيق الغليظة وفتحه، فأخذه العفريت إلى بحيرة مسحورة هادئة بين أربعة جبال شاهقة، وقال له: ارمِ شبكتك هنا مرة واحدة فقط في كل يوم. فرمى الصياد شبكته فخرجت له أربع سمكات ملونة بألوان عجيبة لم يرَ مثلها قط: بيضاء وزرقاء وصفراء وحمراء، فتعجب منها الملك والناس جميعاً وعم الخبر كل أرجاء المدينة.",
    contentEn: "As soon as the genie was entirely inside the jar, the fisherman intelligently and with lightning speed took the lead stopper sealed with Solomon's seal and closed the mouth of the jar very tightly. The genie cried from inside in a muffled voice filled with terror: 'O fisherman, open for me and I will give you inexhaustible treasures and make you the richest of the kings of the earth!' The fisherman said in a triumphant tone: 'You lie, O cursed one! I will throw you now into the dark depths of the sea and build a house here and warn all fishermen about you and your treachery, and I will write on the shore: \"Here lies a treacherous genie who does not keep his promises.\"' The genie began to plead, weep, and swear by the strongest and most sacred oaths that he would never harm him, but would teach him a great secret that would make him the richest man of his time and lead him to endless happiness. The fisherman believed him after taking his solemn promises and covenants and opened it. The genie took him to a calm, enchanted lake between four towering mountains and said: 'Cast your net here only once each day.' The fisherman cast his net and brought up four fish colored in amazing hues he had never seen before: white, blue, yellow, and red, which astonished the King and all the people, and the news spread throughout the city.'",
    reviewPart: 6,
    questions: [
      { q: "ضمير الغائب للمثنى (مذكر أو مؤنث) هو:", qEn: "The third-person dual pronoun (masc. or fem.) is:", a: "هما", options: ["هم", "هن", "هما", "هي"], optionsEn: ["They (masc. plural)", "They (fem. plural)", "They (dual)", "She"] },
      { q: "كيف تقول 'You all' (للمؤنث)؟", qEn: "How do you say 'You all' (feminine)?", a: "أنتن", options: ["أنتم", "أنتن", "أنتما", "أنتِ"], optionsEn: ["You (masc. plural)", "You (fem. plural)", "You (dual)", "You (singular fem.)"] },
      { q: "ما هو الضمير المناسب لـ 'Student' (أنا)؟", qEn: "What is the appropriate pronoun for 'Student' (I)?", a: "أنا طالب", options: ["هو طالب", "أنا طالب", "نحن طالب", "أنت طالب"], optionsEn: ["He is a student", "I am a student", "We are a student", "You are a student"] },
      { q: "ما هو الضمير المناسب لـ 'Teachers' (نحن)؟", qEn: "What is the appropriate pronoun for 'Teachers' (We)?", a: "نحن مدرسون", options: ["أنا مدرسون", "نحن مدرسون", "هم مدرسون", "أنتم مدرسون"], optionsEn: ["I am teachers", "We are teachers", "They are teachers", "You are teachers"] },
      { q: "كيف تقول 'He is a doctor'؟", qEn: "How do you say 'He is a doctor'?", a: "هو طبيب", options: ["هي طبيبة", "هو طبيب", "أنا طبيب", "أنت طبيب"], optionsEn: ["She is a doctor", "He is a doctor", "I am a doctor", "You are a doctor"] }
    ]
  },
  {
    title: "الليلة السابعة عشرة: الحمال وبنات بغداد",
    titleEn: "Night 17: The Porter and the Ladies of Baghdad",
    content: "حكت شهرزاد بابتسامة: كان في مدينة بغداد حمال فقير ولكنه قوي البنية طيب القلب، وقفت عليه يوماً امرأة جميلة رائعة الجمال، ملفوفة بوشاح من حرير غالي الثمن وقالت له بصوت عذب: احمل قفتك واتبعني يا حمال. فتبعها وهو متعجب من جمالها وهيبتها، فذهبت به إلى بائع اللحم فاشترت أحسن اللحوم، ثم بائع الفاكهة فاشترت من كل صنف، ثم بائع الحلويات والزهور العطرة، حتى ملأت القفة بكل ما لذ وطاب من خيرات الأرض. ثم ذهبت به إلى دار عظيمة فخمة لها باب من أبنوس مرصع بالذهب، ففتحت لها الباب جارية رشيقة كالغزال، ودخل الحمال فوجد ثلاث أخوات جميلات كأنهن أقمار في ليلة تمامها: صاحبة الدار، والقهرمانة المدبرة، والبوابة الرقيقة. فأكلوا وشربوا وضحكوا في جو من السرور والبهجة التي لم يرَ الحمال مثلها قط، فاستأذن الحمال في الانصراف خجلاً، فقالت له صاحبة الدار بلطف وكرم: اجلس معنا الليلة لتؤنسنا وتنسى همومك وتعب يومك، فإننا نحب الرفقة الطيبة. وبينما هم في قمة سرورهم وغنائهم، طرق الباب ثلاثة صعاليك عور، كل واحد منهم فقد عينه اليمنى، فدخلوا وجلسوا معهم، ثم طرق الباب ثلاثة تجار متنكرون في زي الغرباء، وهم في الحقيقة الخليفة هارون الرشيد ووزيره جعفر ومسرور السياف، خرجوا ليتفقدوا أحوال الرعية.",
    contentEn: "Scheherazade told with a smile: 'There was in the city of Baghdad a poor but strong and kind-hearted porter. One day, a woman of exquisite beauty, wrapped in an expensive silk shawl, stood over him and said in a sweet voice: \"Take your basket and follow me, O porter.\" He followed her, marveled by her beauty and dignity; she took him to the butcher and bought the best meats, then the fruit seller and bought from every variety, then the sweets and fragrant flower seller, until the basket was full of everything delicious from the earth's bounty. Then she took him to a grand, luxurious house with an ebony door inlaid with gold; a maid as graceful as a gazelle opened it, and the porter entered to find three sisters as beautiful as moons on a full night: the mistress of the house, the managing cateress, and the gentle portress. They ate, drank, and laughed in an atmosphere of joy and delight such as the porter had never seen. The porter shyly asked to leave, but the mistress said with kindness and generosity: \"Stay with us tonight to keep us company and forget your worries and the day's toil, for we love good company.\" While they were at the height of their joy and singing, three one-eyed dervishes knocked on the door, each having lost his right eye; they entered and sat with them. Then three disguised merchants knocked—they were in fact Caliph Harun al-Rashid, his vizier Ja'far, and Masrur the executioner, who had gone out to check on the condition of the subjects.'",
    reviewPart: 7,
    questions: [
      { q: "كيف تقول 'This' للمذكر؟", qEn: "How do you say 'This' for masculine?", a: "هذا", options: ["هذه", "هذا", "هذان", "هؤلاء"], optionsEn: ["Hadhihi", "Hadha", "Hadhan", "Ha'ula'i"] },
      { q: "اسم الإشارة للمؤنث المفرد هو:", qEn: "The demonstrative pronoun for singular feminine is:", a: "هذه", options: ["هذا", "هذه", "هاتان", "هؤلاء"], optionsEn: ["Hadha", "Hadhihi", "Hatan", "Ha'ula'i"] },
      { q: "كيف تشير إلى مجموعة من الناس (قريب)؟", qEn: "How do you refer to a group of people (near)?", a: "هؤلاء", options: ["هذا", "هذه", "هؤلاء", "تلك"], optionsEn: ["Hadha", "Hadhihi", "Ha'ula'i", "Tilka"] },
      { q: "اسم الإشارة للمثنى المذكر هو:", qEn: "The demonstrative pronoun for dual masculine is:", a: "هذان", options: ["هاتان", "هذان", "هذا", "هؤلاء"], optionsEn: ["Hatan", "Hadhan", "Hadha", "Ha'ula'i"] },
      { q: "كيف تقول 'That' للمذكر البعيد؟", qEn: "How do you say 'That' for distant masculine?", a: "ذلك", options: ["هذا", "ذلك", "تلك", "أولئك"], optionsEn: ["Hadha", "Dhalika", "Tilka", "Ula'ika"] }
    ]
  },
  {
    title: "الليلة الثامنة عشرة: الصعاليك الثلاثة",
    titleEn: "Night 18: The Three Dervishes",
    content: "اجتمع الجميع في تلك الدار الغامضة، فوضعت الأخوات مائدة عامرة بالطعام والشراب، ولكن صاحبة الدار اشترطت عليهم شرطاً غريباً قائلة: من تكلم فيما لا يعنيه، سمع ما لا يرضيه! فوافق الجميع وهم في حيرة. وفجأة، أحضرت الأخوات كلبتين سوداوين مقيدتين بسلاسل، فقامت صاحبة الدار بضربهما بالسوط ضرباً وجيعاً حتى بكتا بمرارة، ثم بكت هي معهما وقبلت رأسيهما بحنان. تعجب الخليفة هارون الرشيد ولم يطق صبراً على هذا المشهد الغريب، فأمر وزيره جعفر أن يسأل عن السر. فغضبت الأخوات غضباً شديداً وأمرن الجواري بربط الجميع وتهديدهم بالقتل إن لم يحكوا قصصهم وسبب وجودهم. فبدأ الصعاليك الثلاثة يحكون كيف فقد كل واحد منهم عينه اليمنى في مغامرات عجيبة ومرعبة مع الجن والملوك والكنوز المفقودة.",
    contentEn: "Everyone gathered in that mysterious house, and the sisters set a table full of food and drink, but the mistress of the house made a strange condition: 'Whoever speaks of what does not concern him shall hear what does not please him!' They all agreed in confusion. Suddenly, the sisters brought two black dogs bound with chains; the mistress beat them painfully with a whip until they wept bitterly, then she wept with them and kissed their heads tenderly. Caliph Harun al-Rashid was amazed and could not bear this strange sight, so he ordered his vizier Ja'far to ask about the secret. The sisters grew very angry and ordered the maids to bind everyone and threatened to kill them unless they told their stories and the reason for their presence. So the three dervishes began to tell how each of them lost his right eye in amazing and terrifying adventures with jinn, kings, and lost treasures.'",
    reviewPart: 7,
    questions: [
      { q: "اسم الإشارة للمؤنث البعيد هو:", qEn: "The demonstrative pronoun for distant feminine is:", a: "تلك", options: ["ذلك", "تلك", "هذه", "أولئك"], optionsEn: ["Dhalika", "Tilka", "Hadhihi", "Ula'ika"] },
      { q: "كيف تشير إلى مجموعة من الناس (بعيد)؟", qEn: "How do you refer to a group of people (distant)?", a: "أولئك", options: ["هؤلاء", "أولئك", "تلك", "ذلك"], optionsEn: ["Ha'ula'i", "Ula'ika", "Tilka", "Dhalika"] },
      { q: "اسم الإشارة للمثنى المؤنث هو:", qEn: "The demonstrative pronoun for dual feminine is:", a: "هاتان", options: ["هذان", "هاتان", "هذه", "هؤلاء"], optionsEn: ["Hadhan", "Hatan", "Hadhihi", "Ha'ula'i"] },
      { q: "ماذا تقول للإشارة إلى 'Book' (قريب)؟", qEn: "What do you say to refer to 'Book' (near)?", a: "هذا كتاب", options: ["هذه كتاب", "هذا كتاب", "تلك كتاب", "هؤلاء كتاب"], optionsEn: ["Hadhihi kitab", "Hadha kitab", "Tilka kitab", "Ha'ula'i kitab"] },
      { q: "ماذا تقول للإشارة إلى 'Car' (قريب)؟", qEn: "What do you say to refer to 'Car' (near)?", a: "هذه سيارة", options: ["هذا سيارة", "هذه سيارة", "ذلك سيارة", "هاتان سيارة"], optionsEn: ["Hadha sayyarah", "Hadhihi sayyarah", "Dhalika sayyarah", "Hatan sayyarah"] }
    ]
  },
  {
    title: "الليلة التاسعة عشرة: فضول الخليفة",
    titleEn: "Night 19: The Caliph's Curiosity",
    content: "لما هددت الأخوات الجميع بالقتل، بدأ الصعاليك الثلاثة يحكون قصصهم العجيبة. حكى الصعلوك الأول كيف كان ابن ملك وكيف فقد عينه في مغامرة مرعبة تحت الأرض. وحكى الصعلوك الثاني كيف سحره جني وحوله إلى قرد، ثم استعاد شكله البشري ولكنه فقد عينه في معركة سحرية كبرى. وحكى الصعلوك الثالث كيف طار به حصان أسود مسحور وضرب عينه بجناحه. تعجب الخليفة هارون الرشيد مما سمع، وأمرهم جميعاً بالحضور إلى قصره في الصباح ليعرف سر الكلبتين السوداوين والجروح التي على أجساد الأخوات. فحكت صاحبة الدار أن الكلبتين هما أختاها اللتان غدرتا بها وألقتا بها في البحر، فأنقذتها جنية طيبة وسحرتهما كلبتين عقاباً لهما، وأمرتها بضربهما كل ليلة.",
    contentEn: "When the sisters threatened everyone with death, the three dervishes began to tell their amazing stories. The first dervish told how he was a King's son and how he lost his eye in a terrifying underground adventure. The second dervish told how a genie bewitched him and turned him into a monkey, then he regained his human form but lost his eye in a great magical battle. The third dervish told how an enchanted black horse flew with him and struck his eye with its wing. Caliph Harun al-Rashid was astonished by what he heard and ordered them all to come to his palace in the morning to learn the secret of the two black dogs and the scars on the sisters' bodies. The mistress of the house then revealed that the two dogs were her sisters who had betrayed her and thrown her into the sea; a kind fairy had saved her and turned them into dogs as punishment, ordering her to beat them every night.'",
    reviewPart: 7,
    questions: [
      { q: "كيف تشير إلى 'Two students' (مذكر، قريب)؟", qEn: "How do you refer to 'Two students' (masc., near)?", a: "هذان طالبان", options: ["هاتان طالبان", "هذان طالبان", "هؤلاء طالبان", "هذا طالبان"], optionsEn: ["Hatan taliban", "Hadhan taliban", "Ha'ula'i taliban", "Hadha taliban"] },
      { q: "كيف تشير إلى 'Two girls' (قريب)؟", qEn: "How do you refer to 'Two girls' (near)?", a: "هاتان بنتان", options: ["هذان بنتان", "هاتان بنتان", "هذه بنتان", "أولئك بنتان"], optionsEn: ["Hadhan bintan", "Hatan bintan", "Hadhihi bintan", "Ula'ika bintan"] },
      { q: "ما هو اسم الإشارة المناسب لـ 'House' (بعيد)؟", qEn: "What is the appropriate demonstrative pronoun for 'House' (distant)?", a: "ذلك بيت", options: ["هذا بيت", "ذلك بيت", "تلك بيت", "هؤلاء بيت"], optionsEn: ["Hadha bayt", "Dhalika bayt", "Tilka bayt", "Ha'ula'i bayt"] },
      { q: "ما هو اسم الإشارة المناسب لـ 'Sun' (بعيد)؟", qEn: "What is the appropriate demonstrative pronoun for 'Sun' (distant)?", a: "تلك شمس", options: ["ذلك شمس", "تلك شمس", "هذه شمس", "هذا شمس"], optionsEn: ["Dhalika shams", "Tilka shams", "Hadhihi shams", "Hadha shams"] },
      { q: "كيف تشير إلى 'Stars' (بعيد)؟", qEn: "How do you refer to 'Stars' (distant)?", a: "تلك نجوم", options: ["هؤلاء نجوم", "أولئك نجوم", "تلك نجوم", "ذلك نجوم"], optionsEn: ["Ha'ula'i nujum", "Ula'ika nujum", "Tilka nujum", "Dhalika nujum"] }
    ]
  },
  {
    title: "الليلة العشرون: حكاية الصياد والسمكات",
    titleEn: "Night 20: The Story of the Fisherman and the Fish",
    content: "حكت شهرزاد ببراعة: اصطاد الصياد أربع سمكات ملونة، فباعها لوزير الملك الذي تعجب من ألوانها الزاهية: البيضاء والزرقاء والصفراء والحمراء. ولما كانت الطباخة تقلي السمك في المطبخ، انشق الحائط فجأة وخرجت منه جارية جميلة القوام تحمل غصناً من خيزران أخضر، فوضعت الغصن في المقلاة وسألت السمكات بصوت مسموع: يا سمك، هل أنتم على العهد مقيمون؟ فرفعت السمكات رؤوسها من الزيت المغلي وأجابت بصوت واحد: نعم، نعم، إن عدت عدنا، وإن وفيت وفينا. ثم غابت الجارية وانشق الحائط وعاد كما كان كأن شيئاً لم يكن. فتعجب الملك وخرج بنفسه ليبحث عن السر وراء هذه الظاهرة الغريبة، فوصل بعد رحلة شاقة إلى الجبل الأسود ووجد هناك قصراً عظيماً مهيباً من رخام أسود. دخل الملك القصر فوجد شاباً وسيماً جالساً على سرير من ذهب، فناداه الشاب وبكى بكاءً مراً، ولما حاول الشاب القيام ليحيي الملك، اكتشف الملك بذهول أن نصفه الأعلى بشر حي ينبض، ونصفه الأسفل من الوسط إلى القدمين حجر صلد لا يتحرك.",
    contentEn: "Scheherazade told skillfully: 'The fisherman caught four colored fish and sold them to the King's vizier, who was amazed by their bright colors: white, blue, yellow, and red. While the cook was frying the fish in the kitchen, the wall suddenly split and a beautiful maid came out carrying a green bamboo branch. She placed the branch in the frying pan and asked the fish in an audible voice: \"O fish, are you still faithful to the covenant?\" The fish raised their heads from the boiling oil and answered in one voice: \"Yes, yes; if you return, we return; if you are faithful, we are faithful.\" Then the maid disappeared, and the wall closed as it was, as if nothing had happened. The King was astonished and went out himself to seek the secret behind this strange phenomenon. After an arduous journey, he reached the Black Mountain and found a grand, majestic palace of black marble. The King entered and found a handsome young man sitting on a golden bed; the young man called to him and wept bitterly. When the young man tried to stand to greet the King, the King discovered with amazement that his upper half was a living, pulsing human, but his lower half, from the waist to the feet, was solid, immovable stone.'",
    reviewPart: 8,
    questions: [
      { q: "كيف تقول 'I am Egyptian' (مذكر)؟", qEn: "How do you say 'I am Egyptian' (masc.)?", a: "أنا مصري", options: ["أنا مصر", "أنا مصري", "أنا مصرية", "أنا مصريون"], optionsEn: ["Ana Misr", "Ana Misri", "Ana Misriyyah", "Ana Misriyyun"] },
      { q: "النسبة لـ 'Jordan' هي:", qEn: "The nisba (nationality) for 'Jordan' is:", a: "أردني", options: ["أردن", "أردني", "أردنية", "أردنيون"], optionsEn: ["Urdun", "Urduni", "Urduniyyah", "Urduniyyun"] },
      { q: "كيف تقول 'She is Lebanese'؟", qEn: "How do you say 'She is Lebanese'?", a: "هي لبنانية", options: ["هو لبناني", "هي لبنانية", "أنا لبناني", "نحن لبنانيون"], optionsEn: ["Huwa Lubnani", "Hiya Lubnaniyyah", "Ana Lubnani", "Nahnu Lubnaniyyun"] },
      { q: "النسبة لـ 'America' هي:", qEn: "The nisba (nationality) for 'America' is:", a: "أمريكي", options: ["أمريكا", "أمريكي", "أمريكية", "أمريكيون"], optionsEn: ["Amrika", "Amriki", "Amrikiyyah", "Amrikiyyun"] },
      { q: "كلمة 'عربي' هي نسبة لـ:", qEn: "The word 'Arabi' is a nisba for:", a: "العرب", options: ["العرب", "الغرب", "الشرق", "الشمال"], optionsEn: ["The Arabs", "The West", "The East", "The North"] }
    ]
  },
  {
    title: "الليلة الرابعة والعشرون: رحلات السندباد",
    titleEn: "Night 24: The Voyages of Sinbad",
    content: "حكت شهرزاد: في الرحلة الثانية، نسي السندباد في جزيرة مهجورة ووجد بيضة الرخ العظيمة التي تشبه القبة البيضاء. ربط نفسه بعمامته في رجل الطائر حتى حمله إلى وادي الماس العميق. وهناك رأى التجار يرمون الذبائح من فوق الجبال لتلتصق بها الجواهر، فجمع السندباد كمية كبيرة من الماس وربط نفسه بقطعة لحم كبيرة حتى حمله نسر ضخم إلى قمة الجبل. فنجا وعاد إلى بغداد بثروة طائلة. وفي الرحلة الثالثة، واجه العملاق آكل البشر الذي كان يختار أسمن البحارة ليشويها ويأكلها، فتمكن السندباد ورفاقه من سمل عين العملاق والهروب. وفي الرابعة، دفن حياً في سرداب مظلم مع زوجته الميتة، ولكنه وجد مخرجاً سرياً ونجا مرة أخرى. وفي كل مرة، كان السندباد يشكر الله على نجاته ويتعلم درساً جديداً في الصبر والذكاء.",
    contentEn: "Scheherazade told: 'On the second voyage, Sinbad was forgotten on a deserted island and found the egg of the great Roc bird, which resembled a white dome. He tied himself with his turban to the bird's leg until it carried him to the deep Valley of Diamonds. There he saw merchants throwing carcasses from the mountaintops for jewels to stick to; Sinbad collected a large amount of diamonds and tied himself to a large piece of meat until a huge eagle carried him to the mountain top. He escaped and returned to Baghdad with vast wealth. On the third voyage, he faced the man-eating giant who chose the fattest sailors to roast and eat; Sinbad and his companions managed to blind the giant and escape. On the fourth, he was buried alive in a dark vault with his dead wife, but he found a secret exit and escaped again. Each time, Sinbad thanked God for his survival and learned a new lesson in patience and intelligence.'",
    reviewPart: 9,
    questions: [
      { q: "كيف تطلب 'The bill, please'؟", qEn: "How do you ask for 'The bill, please'?", a: "الحساب، لو سمحت", options: ["قائمة الطعام، من فضلك", "الحساب، لو سمحت", "بكم هذا؟", "أريد خبزاً"], optionsEn: ["The menu, please", "The bill, please", "How much is this?", "I want bread"] },
      { q: "ماذا تقول عندما تعتذر؟", qEn: "What do you say when you apologize?", a: "أنا آسف", options: ["شكراً", "أنا آسف", "أهلاً", "تفضل"], optionsEn: ["Thanks", "I am sorry", "Hello", "Please"] },
      { q: "كيف تسأل 'What time is it?'؟", qEn: "How do you ask 'What time is it?'?", a: "كم الساعة؟", options: ["ما اسمك؟", "كم الساعة؟", "أين أنت؟", "كيف حالك؟"], optionsEn: ["What is your name?", "What time is it?", "Where are you?", "How are you?"] },
      { q: "ماذا تقول عندما تريد المساعدة؟", qEn: "What do you say when you want help?", a: "هل يمكنك مساعدتي؟", options: ["هل يمكنك مساعدتي؟", "شكراً لك", "مع السلامة", "أهلاً"], optionsEn: ["Can you help me?", "Thank you", "Goodbye", "Hello"] },
      { q: "كيف تقول 'I don't understand'؟", qEn: "How do you say 'I don't understand'?", a: "لا أفهم", options: ["أفهم", "لا أفهم", "أعرف", "لا أعرف"], optionsEn: ["I understand", "I don't understand", "I know", "I don't know"] }
    ]
  },
  {
    title: "الليلة الخامسة والعشرون: جزيرة القرود",
    titleEn: "Night 25: The Island of Apes",
    content: "حكت شهرزاد: كان في مدينة بالصين شاب فقير يدعى علاء الدين، يعيش مع أمه الأرملة. جاءه ساحر مغربي ادعى أنه عمه المفقود، وأخذه إلى مغارة مسحورة تحت الأرض ليخرج له مصباحاً قديماً. أعطاه الساحر خاتماً سحرياً ليحميه، ونزل علاء الدين المغارة ووجد كنوزاً وجواهر لا تعد ولا تحصى. أخذ علاء الدين المصباح، ولكن الساحر غدر به وأغلق عليه باب المغارة لأنه رفض تسليم المصباح قبل الخروج. وفي ظلمة المغارة، فرك علاء الدين الخاتم بالخطأ، فخرج له جني الخاتم وأنقذه وأعاده إلى أمه. اكتشف علاء الدين لاحقاً أن في المصباح جنياً أعظم يحقق كل الأمنيات المستحيلة. فطلب من جني المصباح قصراً منيفاً وجواهر نادرة، وتقدم لخطبة ابنة السلطان 'بدر البدور'، وعاشوا في سعادة حتى عاد الساحر الشرير ليحاول سرقة المصباح مرة أخرى.",
    contentEn: "Scheherazade told: 'In a city in China, there was a poor youth named Aladdin, living with his widowed mother. A Moroccan sorcerer came to him, claiming to be his long-lost uncle, and took him to an enchanted underground cave to bring out an old lamp. The sorcerer gave him a magic ring for protection. Aladdin descended into the cave and found countless treasures and jewels. He took the lamp, but the sorcerer betrayed him and locked the cave door because he refused to hand over the lamp before coming out. In the darkness of the cave, Aladdin accidentally rubbed the ring, and the genie of the ring appeared, saved him, and returned him to his mother. Aladdin later discovered that the lamp held an even greater genie who fulfills all impossible wishes. He asked the genie for a magnificent palace and rare jewels, and proposed to the Sultan's daughter, \"Badr al-Budur.\" They lived in happiness until the evil sorcerer returned to try and steal the lamp again.'",
    reviewPart: 9,
    questions: [
      { q: "كيف تقول 'I want to go to the airport'؟", qEn: "How do you say 'I want to go to the airport'?", a: "أريد الذهاب إلى المطار", options: ["أريد الذهاب إلى الفندق", "أريد الذهاب إلى المطار", "أريد الذهاب إلى السوق", "أريد الذهاب إلى البيت"], optionsEn: ["I want to go to the hotel", "I want to go to the airport", "I want to go to the market", "I want to go home"] },
      { q: "ماذا تقول عندما تسأل عن السعر؟", qEn: "What do you say when you ask about the price?", a: "بكم هذا؟", options: ["ما هذا؟", "بكم هذا؟", "أين هذا؟", "من هذا؟"], optionsEn: ["What is this?", "How much is this?", "Where is this?", "Who is this?"] },
      { q: "كيف تقول 'I speak a little Arabic'؟", qEn: "How do you say 'I speak a little Arabic'?", a: "أتكلم العربية قليلاً", options: ["أتكلم العربية جيداً", "أتكلم العربية قليلاً", "لا أتكلم العربية", "أنا عربي"], optionsEn: ["I speak Arabic well", "I speak a little Arabic", "I don't speak Arabic", "I am an Arab"] },
      { q: "ماذا تقول عندما تريد 'Water'؟", qEn: "What do you say when you want 'Water'?", a: "أريد ماءً، من فضلك", options: ["أريد خبزاً", "أريد ماءً، من فضلك", "أريد شاياً", "أريد قهوة"], optionsEn: ["I want bread", "I want water, please", "I want tea", "I want coffee"] },
      { q: "كيف تقول 'Nice to meet you'؟", qEn: "How do you say 'Nice to meet you'?", a: "سعدت بلقائك", options: ["أهلاً بك", "سعدت بلقائك", "مع السلامة", "شكراً"], optionsEn: ["Welcome", "Nice to meet you", "Goodbye", "Thanks"] }
    ]
  },
  {
    title: "الليلة السادسة والعشرون: علاء الدين والمصباح",
    titleEn: "Night 26: Aladdin and the Lamp",
    content: "حكت شهرزاد: كان علاء الدين فتى فقيراً، جاءه ساحر ادعى أنه عمه وأخذه لمغارة سحرية ليخرج مصباحاً قديماً. نزل علاء الدين ووجد كنوزاً، فأخذ المصباح ولكن الساحر أغلق عليه المغارة. ففرك علاء الدين خاتماً كان في يده فخرج له جني أنقذه. عاد لأمه واكتشف أن في المصباح جنياً أعظم يحقق كل الأمنيات. فطلب من الجني قصراً وتزوج ابنة السلطان بدر البدور. وعاشوا في سعادة حتى عرف الساحر أن علاء الدين لم يمت، فقرر العودة للانتقام واستعادة المصباح.",
    contentEn: "Scheherazade told: 'Aladdin was a poor boy. A sorcerer came claiming to be his uncle and took him to a magic cave to bring out an old lamp. Aladdin went down and found treasures; he took the lamp, but the sorcerer locked the cave on him. Aladdin rubbed a ring on his hand, and a genie appeared and saved him. He returned to his mother and discovered that the lamp held an even greater genie who fulfills all wishes. He asked the genie for a palace and married the Sultan's daughter Badroulbadour. They lived happily until the sorcerer learned Aladdin hadn't died and decided to return for revenge and to recover the lamp.'",
    reviewPart: 10,
    questions: [
      { q: "حرف الجر 'في' يعني:", qEn: "The preposition 'Fi' means:", a: "In", options: ["On", "In", "From", "To"], optionsEn: ["On", "In", "From", "To"] },
      { q: "حرف الجر 'على' يعني:", qEn: "The preposition 'Ala' means:", a: "On", options: ["Under", "On", "Between", "With"], optionsEn: ["Under", "On", "Between", "With"] },
      { q: "كيف تقول 'To the school'؟", qEn: "How do you say 'To the school'?", a: "إلى المدرسة", options: ["في المدرسة", "إلى المدرسة", "من المدرسة", "على المدرسة"], optionsEn: ["In the school", "To the school", "From the school", "On the school"] },
      { q: "حرف الجر 'من' يعني:", qEn: "The preposition 'Min' means:", a: "From", options: ["To", "From", "About", "In"], optionsEn: ["To", "From", "About", "In"] },
      { q: "كيف تقول 'With the teacher'؟", qEn: "How do you say 'With the teacher'?", a: "مع المدرس", options: ["عن المدرس", "مع المدرس", "بالمدرس", "للمدرس"], optionsEn: ["About the teacher", "With the teacher", "By the teacher", "For the teacher"] }
    ]
  },
  {
    title: "الليلة السابعة والعشرون: الساحر الشرير",
    titleEn: "Night 27: The Evil Magician",
    content: "تنكر الساحر في زي بائع مصابيح وصاح: من يبدل مصباحاً قديماً بمصباح جديد؟ فخدع الأميرة وأخذ المصباح، وأمر الجني بنقل القصر وزوجة علاء الدين إلى المغرب. حزن علاء الدين حزناً شديداً، ولكنه استعان بجني الخاتم الذي نقله إلى المغرب. وهناك التقى بزوجته ووضع خطة لاستعادة المصباح. فوضعت الأميرة سماً للساحر في شرابه، فلما مات، أخذ علاء الدين المصباح وأمر الجني بإعادة القصر إلى مكانه في الصين. ففرح السلطان بعودتهما وأقام الأفراح.",
    contentEn: "The sorcerer disguised himself as a lamp seller and cried: 'Who will exchange an old lamp for a new one?' He deceived the princess, took the lamp, and ordered the genie to move the palace and Aladdin's wife to Morocco. Aladdin was deeply saddened, but he used the genie of the ring, who transported him to Morocco. There he met his wife and devised a plan to recover the lamp. The princess put poison in the sorcerer's drink; when he died, Aladdin took the lamp and ordered the genie to return the palace to China. The Sultan rejoiced at their return and held celebrations.'",
    reviewPart: 10,
    questions: [
      { q: "حرف الجر 'عن' يعني:", qEn: "The preposition 'An' means:", a: "About / From", options: ["With", "About / From", "Between", "Under"], optionsEn: ["With", "About / From", "Between", "Under"] },
      { q: "كيف تقول 'Under the table'؟", qEn: "How do you say 'Under the table'?", a: "تحت الطاولة", options: ["فوق الطاولة", "تحت الطاولة", "بجانب الطاولة", "خلف الطاولة"], optionsEn: ["Above the table", "Under the table", "Beside the table", "Behind the table"] },
      { q: "حرف الجر 'بـ' يعني غالباً:", qEn: "The preposition 'Bi-' often means:", a: "By / With", options: ["To", "By / With", "From", "In"], optionsEn: ["To", "By / With", "From", "In"] },
      { q: "كيف تقول 'Between the two houses'؟", qEn: "How do you say 'Between the two houses'?", a: "بين البيتين", options: ["بين البيتين", "أمام البيتين", "خلف البيتين", "فوق البيتين"], optionsEn: ["Between the two houses", "In front of the two houses", "Behind the two houses", "Above the two houses"] },
      { q: "حرف الجر 'لـ' يعني:", qEn: "The preposition 'Li-' means:", a: "For / To", options: ["About", "For / To", "With", "On"], optionsEn: ["About", "For / To", "With", "On"] }
    ]
  },
  {
    title: "الليلة الثامنة والعشرون: عودة القصر",
    titleEn: "Night 28: The Return of the Palace",
    content: "بعد عودة القصر، عاش علاء الدين وزوجته في أمان. ولكن أخا الساحر الشرير جاء لينتقم، فتنكر في زي امرأة صالحة تدعى فاطمة، وخدع الأميرة لتدخله القصر. ولكن جني المصباح حذر علاء الدين من الخدعة، فاستطاع علاء الدين أن يقتل أخا الساحر وينقذ أهله. وبعد وفاة السلطان، أصبح علاء الدين هو السلطان الجديد، وحكم بالعدل والرحمة، وعاش مع زوجته في سعادة وهناء حتى أتاهما اليقين. وهذه يا ملك الزمان ليست أعجب من حكاية علي بابا والأربعين حرامي!",
    contentEn: "After the palace returned, Aladdin and his wife lived in safety. But the evil sorcerer's brother came for revenge, disguising himself as a holy woman named Fatima and deceiving the princess into letting him into the palace. However, the genie of the lamp warned Aladdin of the trick, so Aladdin managed to kill the sorcerer's brother and save his family. After the Sultan's death, Aladdin became the new Sultan, ruling with justice and mercy, and lived with his wife in happiness and bliss. 'And this, O King of the Age, is not more amazing than the story of Ali Baba and the Forty Thieves!'",
    reviewPart: 10,
    questions: [
      { q: "كيف تقول 'Behind the door'؟", qEn: "How do you say 'Behind the door'?", a: "خلف الباب", options: ["أمام الباب", "خلف الباب", "بجانب الباب", "فوق الباب"], optionsEn: ["In front of the door", "Behind the door", "Beside the door", "Above the door"] },
      { q: "حرف الجر 'أمام' يعني:", qEn: "The preposition 'Amam' means:", a: "In front of", options: ["Behind", "In front of", "Next to", "Above"], optionsEn: ["Behind", "In front of", "Next to", "Above"] },
      { q: "كيف تقول 'Beside the car'؟", qEn: "How do you say 'Beside the car'?", a: "بجانب السيارة", options: ["بجانب السيارة", "داخل السيارة", "خارج السيارة", "تحت السيارة"], optionsEn: ["Beside the car", "Inside the car", "Outside the car", "Under the car"] },
      { q: "حرف الجر 'فوق' يعني:", qEn: "The preposition 'Fawqa' means:", a: "Above / Over", options: ["Under", "Above / Over", "Inside", "Outside"], optionsEn: ["Under", "Above / Over", "Inside", "Outside"] },
      { q: "كيف تقول 'Inside the box'؟", qEn: "How do you say 'Inside the box'?", a: "داخل الصندوق", options: ["خارج الصندوق", "داخل الصندوق", "فوق الصندوق", "تحت الصندوق"], optionsEn: ["Outside the box", "Inside the box", "Above the box", "Under the box"] }
    ]
  },
  {
    title: "الليلة التاسعة والعشرون: علي بابا والأربعون حرامياً",
    titleEn: "Night 29: Ali Baba and the Forty Thieves",
    content: "حكت شهرزاد: كان علي بابا حطاباً فقيراً، رأى أربعين حرامياً يفتحون مغارة بكلمة: افتح يا سمسم! فأخذ منها ذهباً. ولما عرف أخوه قاسم السر، ذهب للمغارة ونسي الكلمة فقتله اللصوص. عرف اللصوص أن أحداً دخل المغارة، فحاولوا قتل علي بابا، فتنكر زعيمهم في زي تاجر زيت ومعه أربعون جرة، خبأ في كل جرة حرامياً. ولكن الجارية الذكية مرجانة اكتشفت الخدعة، فصبت زيتاً مغلياً في الجرار وقتلت اللصوص، ثم قتلت الزعيم وهي ترقص. فكافأها علي بابا وزوجها لابنه.",
    contentEn: "Scheherazade told: 'Ali Baba was a poor woodcutter who saw forty thieves opening a cave with the words: \"Open Sesame!\" He took gold from it. When his brother Qasim learned the secret, he went to the cave, forgot the word, and was killed by the thieves. The thieves knew someone had entered the cave and tried to kill Ali Baba. Their leader disguised himself as an oil merchant with forty jars, hiding a thief in each. But the clever maid Morgiana discovered the trick, poured boiling oil into the jars, and killed the thieves, then killed the leader while dancing. Ali Baba rewarded her by marrying her to his son.'",
    reviewPart: 11,
    questions: [
      { q: "حرف العطف 'و' يعني:", qEn: "The conjunction 'Wa' means:", a: "And", options: ["Or", "And", "But", "Then"], optionsEn: ["Or", "And", "But", "Then"] },
      { q: "حرف العطف 'أو' يعني:", qEn: "The conjunction 'Aw' means:", a: "Or", options: ["And", "Or", "So", "Then"], optionsEn: ["And", "Or", "So", "Then"] },
      { q: "كيف تقول 'I ate and drank'؟", qEn: "How do you say 'I ate and drank'?", a: "أكلت وشربت", options: ["أكلت أو شربت", "أكلت وشربت", "أكلت ثم شربت", "أكلت فـ شربت"], optionsEn: ["I ate or drank", "I ate and drank", "I ate then drank", "I ate so drank"] },
      { q: "حرف العطف 'ثم' يفيد الترتيب مع:", qEn: "The conjunction 'Thumma' implies ordering with:", a: "التراخي (وقت طويل)", options: ["السرعة", "التراخي (وقت طويل)", "الاختيار", "الشك"], optionsEn: ["Speed", "Delay (long time)", "Choice", "Doubt"] },
      { q: "كيف تقول 'Apple or Orange'؟", qEn: "How do you say 'Apple or Orange'?", a: "تفاح أو برتقال", options: ["تفاح وبرتقال", "تفاح أو برتقال", "تفاح ثم برتقال", "تفاح فـ برتقال"], optionsEn: ["Apple and Orange", "Apple or Orange", "Apple then Orange", "Apple so Orange"] }
    ]
  },
  {
    title: "الليلة الثلاثون: ذكاء مرجانة",
    titleEn: "Night 30: Morgiana's Intelligence",
    content: "كانت مرجانة جارية ذكية جداً، وقد أنقذت حياة علي بابا وأهله بفضل فطنتها. فبعد أن قتلت اللصوص في الجرار، جاء الزعيم متنكراً في زي تاجر قماش ليدخل بيت علي بابا ويقتله أثناء العشاء. ولكن مرجانة عرفته من الخنجر المخبأ تحت ثيابه، فقامت ترقص بالخنجر حتى طعنته في قلبه. ففرح علي بابا وشكرها كثيراً، وأعتقها وزوجها لابنه محمد. وعاشوا جميعاً في رغد من العيش بفضل كنوز المغارة التي لم يعرف سرها أحد غيرهم. وهذه يا ملك الزمان ليست أعجب من حكاية الأبنوس الطائر!",
    contentEn: "Morgiana was a very clever maid who saved the lives of Ali Baba and his family thanks to her wit. After killing the thieves in the jars, the leader came disguised as a cloth merchant to enter Ali Baba's house and kill him during dinner. But Morgiana recognized him by the dagger hidden under his clothes; she danced with a dagger until she stabbed him in the heart. Ali Baba rejoiced and thanked her greatly, freeing her and marrying her to his son Muhammad. They all lived in prosperity thanks to the cave's treasures, whose secret no one else knew. 'And this, O King of the Age, is not more amazing than the story of the Flying Ebony Horse!'",
    reviewPart: 11,
    questions: [
      { q: "حرف العطف 'فـ' يفيد الترتيب مع:", qEn: "The conjunction 'Fa-' implies ordering with:", a: "السرعة (التعقيب)", options: ["التراخي", "السرعة (التعقيب)", "الاختيار", "الجمع"], optionsEn: ["Delay", "Speed (immediate)", "Choice", "Addition"] },
      { q: "كيف تقول 'He entered, then (immediately) sat'؟", qEn: "How do you say 'He entered, then (immediately) sat'?", a: "دخل فجلس", options: ["دخل وجلس", "دخل فجلس", "دخل ثم جلس", "دخل أو جلس"], optionsEn: ["He entered and sat", "He entered so he sat", "He entered then sat", "He entered or sat"] },
      { q: "حرف العطف 'لكن' يعني:", qEn: "The conjunction 'Lakin' means:", a: "But", options: ["And", "But", "Or", "Then"], optionsEn: ["And", "But", "Or", "Then"] },
      { q: "كيف تقول 'I am tired but happy'؟", qEn: "How do you say 'I am tired but happy'?", a: "أنا متعب لكن سعيد", options: ["أنا متعب وسعيد", "أنا متعب لكن سعيد", "أنا متعب أو سعيد", "أنا متعب ثم سعيد"], optionsEn: ["I am tired and happy", "I am tired but happy", "I am tired or happy", "I am tired then happy"] },
      { q: "أي حرف عطف يستخدم للاختيار؟", qEn: "Which conjunction is used for choice?", a: "أو", options: ["و", "أو", "ثم", "فـ"], optionsEn: ["And", "Or", "Then", "So"] }
    ]
  },
  {
    title: "الليلة الحادية والثلاثون: حكاية الأبنوس",
    titleEn: "Night 31: The Story of the Ebony Horse",
    content: "حكت شهرزاد: صنع حكيم هندي حصاناً من أبنوس يطير في الهواء. فركبه ابن ملك فارس وطار به حتى وصل إلى قصر أميرة جميلة في بلاد بعيدة، فأحبها وأراد الزواج منها. ولكن ساحراً شريراً اختطف الأميرة وطار بها إلى بلاد أخرى. فلاحقه الأمير واستطاع بذكائه أن ينقذها ويعود بها على الحصان الطائر إلى بلاده. ففرح الملك وزوجهما، وأمر بتحطيم الحصان حتى لا يقع في يد الأشرار. وهذه يا ملك الزمان ليست أعجب من حكاية جودر بن عمر وأخوته! فقال الملك شهريار: والله لا أقتلها حتى أسمع حكاية جودر.",
    contentEn: "Scheherazade told: 'An Indian sage made an ebony horse that flies in the air. The son of the King of Persia rode it and flew until he reached the palace of a beautiful princess in a distant land; he loved her and wanted to marry her. But an evil sorcerer kidnapped the princess and flew with her to another country. The prince pursued him and, through his intelligence, managed to save her and return with her on the flying horse to his country. The King rejoiced and married them, ordering the horse to be destroyed so it wouldn't fall into evil hands. 'And this, O King of the Age, is not more amazing than the story of Joudar bin Omar and his brothers!' King Shahryar said: 'By God, I will not kill her until I hear Joudar's story.'",
    reviewPart: 11,
    questions: [
      { q: "ما هو حرف العطف الذي يفيد الجمع المطلق؟", qEn: "What is the conjunction that implies absolute addition?", a: "و", options: ["و", "أو", "ثم", "فـ"], optionsEn: ["And", "Or", "Then", "So"] },
      { q: "كيف تقول 'First the father, then (later) the son'؟", qEn: "How do you say 'First the father, then (later) the son'?", a: "الأب ثم الابن", options: ["الأب والابن", "الأب فالابن", "الأب ثم الابن", "الأب أو الابن"], optionsEn: ["The father and the son", "The father so the son", "The father then the son", "The father or the son"] },
      { q: "حرف العطف 'بل' يستخدم لـ:", qEn: "The conjunction 'Bal' is used for:", a: "الإضراب (تصحيح)", options: ["الجمع", "الاختيار", "الإضراب (تصحيح)", "الترتيب"], optionsEn: ["Addition", "Choice", "Correction", "Ordering"] },
      { q: "كيف تقول 'Not a book, but a pen'؟", qEn: "How do you say 'Not a book, but a pen'?", a: "ليس كتاباً بل قلماً", options: ["كتاب وقلم", "كتاب أو قلم", "ليس كتاباً بل قلماً", "كتاب ثم قلم"], optionsEn: ["A book and a pen", "A book or a pen", "Not a book but a pen", "A book then a pen"] },
      { q: "أي حرف عطف يفيد الترتيب والتعقيب؟", qEn: "Which conjunction implies ordering and immediate sequence?", a: "فـ", options: ["و", "فـ", "ثم", "أو"], optionsEn: ["And", "So", "Then", "Or"] }
    ]
  },
  {
    title: "الليلة الثانية والثلاثون: عفو الملك شهريار",
    titleEn: "Night 32: King Shahryar's Pardon",
    content: "استمرت شهرزاد تحكي القصص ليلة بعد ليلة، حتى مرت ألف ليلة وليلة. وفي الليلة الواحدة بعد الألف، أحضرت شهرزاد أولادها الثلاثة وقالت: يا ملك الزمان، هؤلاء أولادك، فهل تقتلني وتيتمهم؟ فبكى الملك وقال: قد عفوت عنكِ يا شهرزاد قبل هؤلاء الأولاد، لما رأيت فيكِ من العقل والحكمة والوفاء. ففرحت المملكة كلها، وأقيمت الأفراح لعدة أيام، وعاش الملك شهريار مع زوجته شهرزاد في سعادة وهناء وعدل، وكتبت هذه القصص بماء الذهب لتكون عبرة لمن يعتبر.",
    contentEn: "Scheherazade continued to tell stories night after night until a thousand and one nights had passed. On the thousand and first night, Scheherazade brought her three children and said: 'O King of the Age, these are your children; will you kill me and orphan them?' The King wept and said: 'I have pardoned you, Scheherazade, even before these children, for the reason and wisdom and loyalty I have seen in you.' The whole kingdom rejoiced, celebrations were held for several days, and King Shahryar lived with his wife Scheherazade in happiness, bliss, and justice. These stories were written in gold water to be a lesson for those who take heed.'",
    reviewPart: 12,
    questions: [
      { q: "ما هو اسم بطلة 'ألف ليلة وليلة'؟", qEn: "What is the name of the heroine of 'One Thousand and One Nights'?", a: "شهرزاد", options: ["مرجانة", "شهرزاد", "ياسمين", "بدور"], optionsEn: ["Morgiana", "Scheherazade", "Yasmin", "Budour"] },
      { q: "كم ليلة حكت فيها شهرزاد القصص? ", qEn: "How many nights did Scheherazade tell stories?", a: "ألف ليلة وليلة", options: ["مائة ليلة", "ألف ليلة وليلة", "خمسين ليلة", "ألف ليلة"], optionsEn: ["One hundred nights", "One thousand and one nights", "Fifty nights", "One thousand nights"] },
      { q: "ما هو اسم الملك في القصة؟", qEn: "What is the name of the King in the story?", a: "شهريار", options: ["هارون الرشيد", "شهريار", "علاء الدين", "علي بابا"], optionsEn: ["Harun al-Rashid", "Shahryar", "Aladdin", "Ali Baba"] },
      { q: "ماذا كانت تفعل شهرزاد لتبقى على قيد الحياة؟", qEn: "What was Scheherazade doing to stay alive?", a: "تحكي القصص", options: ["تغني", "ترقص", "تحكي القصص", "تطبخ"], optionsEn: ["Singing", "Dancing", "Telling stories", "Cooking"] },
      { q: "كيف انتهت القصة؟", qEn: "How did the story end?", a: "عفا الملك عن شهرزاد", options: ["قتل الملك شهرزاد", "هربت شهرزاد", "عفا الملك عن شهرزاد", "مات الملك"], optionsEn: ["The King killed Scheherazade", "Scheherazade escaped", "The King pardoned Scheherazade", "The King died"] }
    ]
  },
  {
    title: "الليلة الثالثة والثلاثون: الصياد والعفريت (1)",
    titleEn: "Night 33: The Fisherman and the Jinni (1)",
    content: "حكت شهرزاد: كان هناك صياد فقير يرمي شبكته أربع مرات في اليوم فقط. في المرة الرابعة، أخرج جرة من نحاس مختومة بخاتم سليمان. ولما فتحها، خرج منها دخان كثيف تحول إلى عفريت هائل أراد قتل الصياد. تعجب الصياد وسأله: لماذا تقتلني وقد أنقذتك؟ فقال العفريت: لقد حبست في هذه الجرة مئات السنين، وفي المائة الأخيرة حلفت أن أقتل من يخرجني. فكر الصياد بذكاء وقال: لا أصدق أنك كنت داخل هذه الجرة الصغيرة! فغضب العفريت ودخل الجرة ليثبت له، فأسرع الصياد وأغلقها بالخاتم السحري.",
    contentEn: "Scheherazade told: 'There was a poor fisherman who cast his net only four times a day. On the fourth time, he pulled out a copper jar sealed with the seal of Solomon. When he opened it, thick smoke came out and turned into a huge jinni who wanted to kill the fisherman. The fisherman was amazed and asked: \"Why kill me when I saved you?\" The jinni said: \"I have been imprisoned in this jar for hundreds of years, and in the last hundred, I swore to kill whoever releases me.\" The fisherman thought cleverly and said: \"I don't believe you were inside this small jar!\" The jinni got angry and entered the jar to prove it, so the fisherman quickly closed it with the magic seal.'",
    reviewPart: 13,
    questions: [
      { q: "الفعل الماضي من 'يأكل' هو:", qEn: "The past tense of 'to eat' is:", a: "أكل", options: ["يأكل", "أكل", "سوف يأكل", "كل"], optionsEn: ["Eats", "Ate", "Will eat", "Eat!"] },
      { q: "كيف تقول 'I wrote' باللغة العربية؟", qEn: "How do you say 'I wrote' in Arabic?", a: "كتبتُ", options: ["كتبتَ", "كتبتِ", "كتبتُ", "كتبنا"], optionsEn: ["You wrote (m)", "You wrote (f)", "I wrote", "We wrote"] },
      { q: "ما هو الفعل الماضي لـ 'يذهب'؟", qEn: "What is the past tense of 'to go'?", a: "ذهب", options: ["يذهب", "ذهب", "اذهب", "ذاهب"], optionsEn: ["Goes", "Went", "Go!", "Going"] },
      { q: "كيف تقول 'They (m) played'؟", qEn: "How do you say 'They (m) played'?", a: "لعبوا", options: ["لعبت", "لعبوا", "لعبنا", "لعبتِ"], optionsEn: ["She played", "They played", "We played", "You played (f)"] },
      { q: "الفعل 'قرأتَ' يعني:", qEn: "The verb 'Qara'ta' means:", a: "You (m) read", options: ["I read", "You (m) read", "She read", "They read"], optionsEn: ["I read", "You (m) read", "She read", "They read"] }
    ]
  },
  {
    title: "الليلة الرابعة والثلاثون: الصياد والعفريت (2)",
    titleEn: "Night 34: The Fisherman and the Jinni (2)",
    content: "توسل العفريت للصياد أن يخرجه مرة أخرى، ووعده بأنه لن يقتله بل سيغنيه. فصدقه الصياد وفتحه، فأخذه العفريت إلى بحيرة بين أربعة جبال، وطلب منه أن يصطاد منها سمكاً ملوناً ليبيعه للملك. اصطاد الصياد أربع سمكات: بيضاء وحمراء وصفراء وزرقاء، وذهب بها للملك الذي تعجب من جمالها. ولكن وراء هذه السمكات سر كبير، فهي في الأصل بشر مسحورون من أديان مختلفة. وهكذا بدأت مغامرة جديدة للملك ليكتشف سر المدينة المسحورة التي تقع خلف الجبال.",
    contentEn: "The jinni begged the fisherman to let him out again, promising not to kill him but to make him rich. The fisherman believed him and opened it. The jinni took him to a lake between four mountains and asked him to catch colored fish to sell to the King. The fisherman caught four fish: white, red, yellow, and blue, and took them to the King, who was amazed by their beauty. But behind these fish lay a great secret: they were originally enchanted humans of different religions. Thus began a new adventure for the King to discover the secret of the enchanted city behind the mountains.'",
    reviewPart: 13,
    questions: [
      { q: "كيف تقول 'We drank'؟", qEn: "How do you say 'We drank'?", a: "شربنا", options: ["شربتُ", "شربنا", "شربوا", "شربتَ"], optionsEn: ["I drank", "We drank", "They drank", "You drank"] },
      { q: "الفعل الماضي لـ 'تطبخ' (هي) هو:", qEn: "The past tense of 'to cook' (she) is:", a: "طبختْ", options: ["طبختُ", "طبختَ", "طبختْ", "طبخنا"], optionsEn: ["I cooked", "You cooked", "She cooked", "We cooked"] },
      { q: "ماذا يعني الفعل 'رأيتُ'؟", qEn: "What does the verb 'Ra'aytu' mean?", a: "I saw", options: ["I saw", "You saw", "He saw", "We saw"], optionsEn: ["I saw", "You saw", "He saw", "We saw"] },
      { q: "كيف تقول 'You (f) understood'؟", qEn: "How do you say 'You (f) understood'?", a: "فهمتِ", options: ["فهمتُ", "فهمتَ", "فهمتِ", "فهمنا"], optionsEn: ["I understood", "You (m) understood", "You (f) understood", "We understood"] },
      { q: "الفعل الماضي لـ 'ينام' هو:", qEn: "The past tense of 'to sleep' is:", a: "نام", options: ["ينام", "نام", "نمتُ", "ناموا"], optionsEn: ["Sleeps", "Slept", "I slept", "They slept"] }
    ]
  },
];

const VideoRecorder = ({ onRecordingComplete, isRecording, setIsRecording }: { 
  onRecordingComplete: (blob: Blob) => void,
  isRecording: boolean,
  setIsRecording: (val: boolean) => void
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onRecordingComplete(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      {isRecording && (
        <div style={{ position: 'relative', width: '200px', margin: '0 auto 10px' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: '8px', border: '2px solid #ef4444' }} />
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
        </div>
      )}
      <button 
        className={isRecording ? "secondary" : "primary"} 
        onClick={isRecording ? stopRecording : startRecording}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
      >
        {isRecording ? <Square size={18} /> : <Video size={18} />}
        {isRecording ? "Stop Recording" : "Record Reading"}
      </button>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const ReadingView = ({ 
  t, 
  lang, 
  nightIndex, 
  onNext, 
  onFinish,
  onBack,
  studentName,
  studentEmail
}: { 
  t: (key: any) => string, 
  lang: string, 
  nightIndex: number, 
  onNext: () => void, 
  onFinish: () => void,
  onBack: () => void,
  studentName: string,
  studentEmail: string
}) => {
  const night = STORY_NIGHTS[nightIndex] || STORY_NIGHTS[0];
  const [showQuestions, setShowQuestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    setShowQuestions(true);
  };

  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [finishedQuestions, setFinishedQuestions] = useState(false);

  const sendData = async (score: number, total: number) => {
    setIsSending(true);
    const formData = new FormData();
    if (recordedBlob) {
      formData.append("video", recordedBlob);
    }
    formData.append("studentName", studentName || "Anonymous");
    formData.append("studentEmail", studentEmail || "unknown@example.com");
    formData.append("nightTitle", night.title);
    formData.append("score", score.toString());
    formData.append("total", total.toString());

    try {
      const resp = await fetch("/api/send-recording", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        console.log("Data sent successfully!");
      } else {
        console.error("Failed to send data.");
      }
    } catch (err) {
      console.error("Error sending data:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAnswer = (ans: string) => {
    const newAnswers = [...userAnswers, ans];
    setUserAnswers(newAnswers);
    if (currentQ < night.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setFinishedQuestions(true);
      const score = newAnswers.filter((a, idx) => a === night.questions[idx].a).length;
      sendData(score, night.questions.length);
    }
  };

  const correctCount = userAnswers.filter((ans, idx) => ans === night.questions[idx].a).length;

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            className="secondary" 
            onClick={onBack}
            style={{ padding: '8px 12px', fontSize: '14px' }}
          >
            {lang === 'ar' ? 'عودة →' : 'Back →'}
          </button>
          <h2 style={{ margin: 0 }}>{lang === 'ar' ? night.title : night.titleEn}</h2>
        </div>
        <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>
          {t('readingStory')}
        </span>
      </div>

      {!showQuestions && (
        <VideoRecorder 
          onRecordingComplete={handleRecordingComplete} 
          isRecording={isRecording} 
          setIsRecording={setIsRecording} 
        />
      )}
      {isSending && (
        <div style={{ textAlign: 'center', padding: '10px', background: '#fef3c7', borderRadius: '8px', marginBottom: '20px', color: '#92400e', fontWeight: 600 }}>
          Sending recording... Please wait.
        </div>
      )}

      {!showQuestions ? (
        <>
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0',
            fontSize: '1.25rem',
            lineHeight: 1.8,
            textAlign: lang === 'ar' ? 'right' : 'left',
            direction: lang === 'ar' ? 'rtl' : 'ltr',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>{lang === 'ar' ? night.title : (night.titleEn || night.title)}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(lang === 'ar' ? night.content : (night.contentEn || night.content))
                .split('\n\n')
                .map((paragraph, idx) => (
                  <p key={idx} style={{ margin: 0 }}>{paragraph}</p>
                ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {nightIndex < STORY_NIGHTS.length - 1 ? (
              <button className="secondary" onClick={onNext} style={{ flex: 1 }}>
                {t('readingNextNight')}
              </button>
            ) : (
              <button className="secondary" onClick={onFinish} style={{ flex: 1 }}>
                {t('readingFinish')}
              </button>
            )}

            <button className="primary" onClick={() => setShowQuestions(true)} style={{ flex: 1 }}>
              {t('readingQuestions')}
            </button>
          </div>
        </>
      ) : !finishedQuestions ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', color: '#64748b' }}>
            {t('readingQuestions')} {currentQ + 1} / {night.questions.length}
          </div>
          <h3 style={{ marginBottom: '30px', fontSize: '1.5rem' }}>
            {lang === 'ar' ? night.questions[currentQ].q : (night.questions[currentQ].qEn || night.questions[currentQ].q)}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {night.questions[currentQ].options.map((opt, idx) => (
              <button 
                key={idx} 
                className="secondary" 
                onClick={() => handleAnswer(opt)}
                style={{ padding: '20px', fontSize: '1.1rem' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>
            {correctCount === night.questions.length ? '🌟' : '📚'}
          </div>
          <h2>{t('readingFinish')}!</h2>
          <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '30px' }}>
            {lang === 'ar' ? `لقد أجبت على ${correctCount} من أصل ${night.questions.length} بشكل صحيح.` : `You answered ${correctCount} out of ${night.questions.length} correctly.`}
          </p>
          {nightIndex < STORY_NIGHTS.length - 1 ? (
            <button className="primary" onClick={() => {
              setShowQuestions(false);
              setCurrentQ(0);
              setUserAnswers([]);
              setFinishedQuestions(false);
              setRecordedBlob(null);
              onNext();
            }}>
              {t('readingNextNight')}
            </button>
          ) : (
            <button className="primary" onClick={onFinish}>
              {t('readingFinish')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const WrittenTaskView = ({
  t,
  currentModule,
  studentName,
  studentEmail,
  writtenTaskContent,
  setWrittenTaskContent,
  fetchPendingTask,
  setScreen
}: WrittenTaskViewProps) => {
  const [submitting, setSubmitting] = useState(false);
  const promptKey = `taskPrompt${currentModule.charAt(0).toUpperCase() + currentModule.slice(1)}` as any;
  const rubrics = ['grammar', 'vocab', 'clarity', 'fluency', 'completion'];

  const handleSubmit = async () => {
    if (!writtenTaskContent.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_email: studentEmail,
          module_key: currentModule,
          content: writtenTaskContent
        })
      });
      await fetchPendingTask();
      setScreen('peerReview');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div className="card">
        <h2>{t('writtenTaskTitle')}</h2>
        <p>{t('writtenTaskDesc')}</p>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <strong>{t(promptKey)}</strong>
        </div>
        <textarea
          style={{ 
            width: '100%', 
            height: '300px', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1', 
            marginBottom: '20px', 
            fontFamily: 'inherit',
            fontSize: '16px',
            lineHeight: '1.6',
            direction: 'rtl'
          }}
          value={writtenTaskContent}
          onChange={(e) => setWrittenTaskContent(e.target.value)}
          placeholder="..."
        />
        <button className="primary" onClick={handleSubmit} disabled={submitting || !writtenTaskContent.trim()}>
          {submitting ? '...' : t('submitTask')}
        </button>
      </div>

      <div className="card" style={{ position: 'sticky', top: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '15px', color: 'var(--a)' }}>{t('correctionCriteria')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rubrics.map((rubric, idx) => (
            <div key={rubric} style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                {idx + 1}. {t(`rubric${idx + 1}` as any)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {t(`${rubric}Desc` as any)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PeerReviewViewProps {
  t: (key: any) => string;
  lang: string;
  studentName: string;
  studentEmail: string;
  pendingTaskToReview: any;
  reviewScores: any;
  setReviewScores: React.Dispatch<React.SetStateAction<any>>;
  reviewFeedback: string;
  setReviewFeedback: (val: string) => void;
  setScreen: (screen: any) => void;
}

const PeerReviewView = ({
  t,
  lang,
  studentName,
  studentEmail,
  pendingTaskToReview,
  reviewScores,
  setReviewScores,
  reviewFeedback,
  setReviewFeedback,
  setScreen
}: PeerReviewViewProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rubrics = ['grammar', 'vocab', 'clarity', 'fluency', 'completion'];

  const handleSubmitReview = async () => {
    const needsFeedback = Object.values(reviewScores).some((s: number) => s < 5);
    if (needsFeedback && !reviewFeedback.trim()) {
      setError(t('explainWhy'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: pendingTaskToReview.id,
          reviewer_name: studentName,
          reviewer_email: studentEmail,
          ...reviewScores,
          feedback: reviewFeedback
        })
      });
      setScreen('end');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pendingTaskToReview) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>{t('peerReviewTitle')}</h2>
        <p>{t('noTasksToReview')}</p>
        <button className="primary" onClick={() => setScreen('end')}>{t('next')}</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{t('peerReviewTitle')}</h2>
      <p>{t('peerReviewDesc')}</p>
      
      <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ whiteSpace: 'pre-wrap' }}>{pendingTaskToReview.content}</p>
      </div>

      {rubrics.map((rubric, i) => (
        <div key={rubric} style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#1e293b' }}>
            {t(`rubric${i + 1}` as any)}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { score: 5, label: lang === 'ar' ? 'ممتاز' : 'Excellent' },
              { score: 4, label: lang === 'ar' ? 'جيد جداً' : 'Good' },
              { score: 3, label: lang === 'ar' ? 'متوسط' : 'Average' },
              { score: 2, label: lang === 'ar' ? 'مقبول' : 'Poor' },
              { score: 1, label: lang === 'ar' ? 'ضعيف' : 'Very Poor' }
            ].map(choice => (
              <button
                key={choice.score}
                onClick={() => {
                  setReviewScores((prev: any) => ({ ...prev, [rubric]: choice.score }));
                  setError(null);
                }}
                style={{
                  padding: '10px 5px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: (reviewScores as any)[rubric] === choice.score ? '#3b82f6' : '#f8fafc',
                  color: (reviewScores as any)[rubric] === choice.score ? '#fff' : '#475569',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>{choice.score}</div>
                <div>{choice.label}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>{t('explainWhy')}</label>
        <textarea
          style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', fontFamily: 'inherit' }}
          value={reviewFeedback}
          onChange={(e) => {
            setReviewFeedback(e.target.value);
            if (e.target.value.trim()) setError(null);
          }}
          placeholder="..."
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <button className="primary" onClick={handleSubmitReview} disabled={submitting}>
        {submitting ? '...' : t('submitReview')}
      </button>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<LangCode>('ar');
  const t = (key: keyof typeof i18n['ar']) => {
    const translations = i18n[lang as keyof typeof i18n] || i18n['en'];
    return (translations as any)[key] || (i18n['en'] as any)[key];
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentModule, setCurrentModule] = useState<'hub' | 'quest' | 'days' | 'greetings' | 'numbers' | 'pronouns' | 'demo' | 'nisba' | 'letters' | 'phrases' | 'prepositions' | 'conjunctions' | 'reading'>('hub');
  const [screen, setScreen] = useState<'start' | 'lesson' | 'quiz' | 'leaderboard' | 'end' | 'writtenTask' | 'peerReview' | 'reading'>('start');
  const [readingNight, setReadingNight] = useState(0);

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [score, setScore] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // New state for streaks and rewards
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [lockedModules, setLockedModules] = useState<Record<string, number>>({});
  const [writtenTaskContent, setWrittenTaskContent] = useState('');
  const [pendingTaskToReview, setPendingTaskToReview] = useState<any>(null);
  const [reviewScores, setReviewScores] = useState({ grammar: 5, vocab: 5, clarity: 5, fluency: 5, completion: 5 });
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [showSkipInfo, setShowSkipInfo] = useState(false);
  const [skipInfoDeactivated, setSkipInfoDeactivated] = useState(false);
  const [hasSeenSkipInfo, setHasSeenSkipInfo] = useState(false);
  const [shuffledParticles, setShuffledParticles] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  useEffect(() => {
    const savedName = localStorage.getItem('studentName');
    const savedEmail = localStorage.getItem('studentEmail');
    const savedRemember = localStorage.getItem('rememberMe');
    
    if (savedName && savedEmail && savedRemember === 'true') {
      setStudentName(savedName);
      setStudentEmail(savedEmail);
      setIsLoggedIn(true);
      setRememberMe(true);
    }
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(lang === 'ar' ? 'متصفحك لا يدعم تسجيل الصوت.' : 'Your browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!window.MediaRecorder) {
        alert(lang === 'ar' ? 'ميزة تسجيل الصوت غير مدعومة في هذا المتصفح.' : 'Audio recording is not supported in this browser.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error accessing microphone", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(lang === 'ar' ? 'تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول من إعدادات المتصفح.' : 'Microphone access denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert(lang === 'ar' ? 'لم يتم العثور على ميكروفون.' : 'No microphone found.');
      } else {
        alert(lang === 'ar' ? 'تعذر الوصول إلى الميكروفون. تأكد من أنه غير مستخدم من قبل تطبيق آخر.' : 'Could not access microphone. Make sure it is not being used by another app.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const SkipButton = () => {
    if (!canSkip) return null;

    return (
      <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
        <button 
          className="primary" 
          style={{ background: '#10b981', borderColor: '#059669' }}
          onClick={skipQuestion}
          onMouseEnter={() => {
            if (!hasSeenSkipInfo && !skipInfoDeactivated) {
              setShowSkipInfo(true);
              setHasSeenSkipInfo(true);
            }
          }}
        >
          ✨ {t('skipBtn')}
        </button>
        
        {showSkipInfo && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            border: '1px solid var(--line)',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 100,
            width: '250px',
            marginBottom: '10px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--ink)' }}>{t('skipInfo')}</p>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={skipInfoDeactivated} 
                onChange={(e) => setSkipInfoDeactivated(e.target.value === 'on')} 
              />
              {t('deactivateInfo')}
            </label>
            <button 
              className="secondary" 
              style={{ padding: '4px 8px', fontSize: '12px', marginTop: '10px', width: '100%' }}
              onClick={() => setShowSkipInfo(false)}
            >
              OK
            </button>
          </div>
        )}
      </div>
    );
  };

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const newLocked = { ...lockedModules };
      
      Object.keys(newLocked).forEach(key => {
        if (newLocked[key] <= now) {
          delete newLocked[key];
          changed = true;
          if (key === currentModule) {
            setWrongStreak(0);
            setTimeLeft(0);
          }
        } else if (key === currentModule) {
          setTimeLeft(Math.ceil((newLocked[key] - now) / 1000));
        }
      });

      if (changed) {
        setLockedModules(newLocked);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedModules, currentModule]);

  const fetchPendingTask = async () => {
    try {
      const res = await fetch(`/api/tasks/pending?email=${studentEmail}&module_key=${currentModule}`);
      const data = await res.json();
      setPendingTaskToReview(data);
    } catch (error) {
      console.error(error);
    }
  };

  const LessonView = ({ title, desc, children, onStart }: { title: string, desc: string, children: React.ReactNode, onStart: () => void }) => {
    const isCurrentLocked = lockedModules[currentModule] > Date.now();
    const printRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
      if (!printRef.current) return;

      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (!printWindow) {
        alert(lang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print');
        return;
      }

      // Capture all styles from the main document
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('\n');

      const contentHtml = printRef.current.innerHTML;

      const html = `
        <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
          <head>
            <title>${title}</title>
            ${styles}
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
              body { 
                padding: 40px; 
                background: white !important;
                font-family: 'Inter', sans-serif;
              }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .card { 
                box-shadow: none !important; 
                border: none !important; 
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-header {
                text-align: center;
                border-bottom: 3px solid #3b82f6;
                margin-bottom: 30px;
                padding-bottom: 15px;
              }
              .print-header h1 { margin: 0; color: #1e293b; }
              .print-header p { color: #64748b; margin: 10px 0 0; }
              
              .footer-print {
                margin-top: 60px;
                text-align: center;
                font-size: 0.85rem;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 15px;
              }
              
              /* Ensure tables and other elements look good in print */
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #e2e8f0; padding: 12px; }
              th { background: #f8fafc; }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${title}</h1>
              <p>${desc}</p>
            </div>
            
            <div class="lesson-content-print">
              ${contentHtml}
            </div>
            
            <div class="footer-print">
              ${t('footer')}
            </div>

            <script>
              window.onload = function() {
                // Small delay to ensure styles and images are loaded
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 800);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    };

    return (
      <div className="card">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: 'var(--muted)' }}>{desc}</p>
          </div>
          <button 
            className="secondary no-print" 
            onClick={handlePrint} 
            style={{ fontSize: '0.8rem', padding: '8px 16px', marginLeft: '10px', whiteSpace: 'nowrap' }}
          >
            🖨️ {lang === 'ar' ? 'طباعة الدرس' : 'Print Full Lesson'}
          </button>
        </div>

        <div ref={printRef}>
          {isCurrentLocked ? (
            <div className="no-print" style={{ background: '#fff1f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca', marginTop: '20px' }}>
              <h3 style={{ color: '#e11d48', marginTop: 0 }}>📝 {t('briefSummaryTitle') || (lang === 'ar' ? 'ملخص سريع' : 'Brief Summary')}</h3>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                {currentModule === 'letters' && t('lettersSummary')}
                {currentModule === 'greetings' && t('part1Desc')}
                {currentModule === 'days' && t('part2Desc')}
                {currentModule === 'quest' && t('part3Desc')}
                {currentModule === 'numbers' && t('part4Desc')}
                {currentModule === 'pronouns' && t('part5Desc')}
                {currentModule === 'demo' && t('part6Desc')}
                {currentModule === 'nisba' && t('part7Desc')}
                {currentModule === 'phrases' && t('part8Desc')}
                {currentModule === 'prepositions' && t('part9Desc')}
                {currentModule === 'conjunctions' && t('part10Desc')}
                {currentModule === 'reading' && t('part11Desc')}
              </p>
              <p style={{ color: '#ef4444', marginTop: '15px', fontWeight: 700, fontSize: '1.2rem' }}>
                ⚠️ {t('readAgain')}
              </p>
            </div>
          ) : (
            children
          )}
        </div>

        <div className="btns no-print" style={{ marginTop: '30px' }}>
          {isCurrentLocked && (
            <button className="primary" onClick={() => setScreen('quiz')} style={{ background: '#10b981', borderColor: '#059669' }}>
              ↩️ {t('returnToQuiz')}
            </button>
          )}
          <button 
            className="primary" 
            onClick={onStart}
            disabled={isCurrentLocked}
          >
            {isCurrentLocked 
              ? t('lockedBtn').replace('{n}', timeLeft.toString()) 
              : t('startLessonQuiz')}
          </button>
          <button className="secondary" onClick={() => setShowBackConfirm(true)}>{t('backToHub')}</button>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--a)' }}>
            🎤 {lang === 'ar' ? 'تدريب على القراءة الجهرية' : 'Oral Reading Practice'}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '15px' }}>
            {lang === 'ar' ? 'سجل صوتك وأنت تقرأ محتوى الدرس بصوت عالٍ.' : 'Record your voice while reading the lesson content aloud.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isRecording ? (
              <button 
                className="primary" 
                onClick={startRecording}
                style={{ background: '#ef4444', borderColor: '#dc2626' }}
              >
                🔴 {lang === 'ar' ? 'بدء التسجيل' : 'Start Recording'}
              </button>
            ) : (
              <button 
                className="primary" 
                onClick={stopRecording}
                style={{ background: '#1e293b', borderColor: '#0f172a', animation: 'pulse 1.5s infinite' }}
              >
                ⏹️ {lang === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording'}
              </button>
            )}
            {audioBlob && !isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '8px 15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <audio src={URL.createObjectURL(audioBlob)} controls style={{ height: '32px' }} />
                <button 
                  className="secondary" 
                  onClick={() => setAudioBlob(null)}
                  style={{ padding: '6px', borderRadius: '8px', minWidth: 'auto' }}
                  title={lang === 'ar' ? 'حذف' : 'Delete'}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
          {isRecording && (
            <div style={{ marginTop: '12px', color: '#ef4444', fontSize: '14px', fontWeight: 700 }}>
              {lang === 'ar' ? 'جاري التسجيل... اقرأ بوضوح' : 'Recording... Read clearly'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const QuizView = ({ moduleKey }: { moduleKey: string }) => {
    if (!currentQuestion) return null;
    return (
      <div className="card">
        <div className="toolbar">
          <div>{t('question')} {currentIndex + 1} {t('of')} {questions.length}</div>
          <div>{t('student')}: <strong>{studentName}</strong></div>
          <div className="markbox">{t('mark')}: {currentQuestion.mark}</div>
        </div>
        
        <h2 className="qar" style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {currentQuestion.question_ar}
        </h2>
        <p className="qen">({currentQuestion.question_en})</p>
        
        <div className="btns" style={{ marginTop: 0 }}>
          <button className="navbtn" onClick={goPrev}>{t('prev')} {lang === 'ar' ? '➡' : '⬅'}</button>
          <button className="navbtn" onClick={goNext}>{lang === 'ar' ? '⬅' : '➡'} {t('next')}</button>
          <SkipButton />
        </div>

        <div className="choices">
          {(currentQuestion.choices || (moduleKey === 'quest' ? shuffledParticles : [])).map((choice, i) => {
            let className = "choice";
            if (currentResponse.isAnswered) {
              if (choice === currentResponse.correctAnswer) className += " correct";
              if (choice === currentResponse.studentAnswer && currentResponse.studentAnswer !== currentResponse.correctAnswer) className += " wrong";
              if (currentResponse.studentAnswer === "SKIPPED" && choice === currentResponse.correctAnswer) className += " correct";
            }
            return (
              <button
                key={i}
                className={className}
                onClick={() => answer(choice)}
                disabled={currentResponse.isAnswered}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <div className={`feedback ${currentResponse.isAnswered ? (currentResponse.earned > 0 ? 'ok' : 'bad') : ''}`}>
          {currentResponse.isAnswered && (
            currentResponse.studentAnswer === "SKIPPED" 
              ? `✨ ${t('skipBtn')}`
              : (currentResponse.earned > 0 ? `✔ ${t('correct')}` : `✖ ${t('wrong')}: ${currentResponse.correctAnswer}`)
          )}
        </div>

        {lockedModules[currentModule] > Date.now() && (
          <div className="feedback bad" style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: 700 }}>⚠️ {t('readAgain')}</p>
            <button className="secondary" onClick={() => setScreen('lesson')} style={{ width: '100%', marginTop: '10px' }}>
              📖 {t('returnToSummary')}
            </button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    setShuffledParticles(shuffle(particles));
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const currentResponse = responses[currentIndex];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() && studentEmail.trim()) {
      if (rememberMe) {
        localStorage.setItem('studentName', studentName);
        localStorage.setItem('studentEmail', studentEmail);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentEmail');
        localStorage.removeItem('rememberMe');
      }
      setIsLoggedIn(true);
    } else {
      alert(lang === 'ar' ? "يرجى إدخال الاسم والبريد الإلكتروني للمتابعة." : "Please enter name and email to continue.");
    }
  };

  const logout = () => {
    localStorage.removeItem('rememberMe'); // Disable auto-login on manual logout
    setIsLoggedIn(false);
    setCurrentModule('hub');
    setScreen('start');
    setStudentName('');
    setStudentEmail('');
  };

  const startGame = (module: 'quest' | 'days' | 'greetings' | 'numbers' | 'pronouns' | 'demo' | 'nisba' | 'letters' | 'phrases' | 'prepositions' | 'conjunctions' | 'reading') => {
    setCurrentModule(module);
    if (module === 'reading') {
      setScreen('reading');
      return;
    }
    setWrittenTaskContent('');
    setReviewScores({ grammar: 5, vocab: 5, clarity: 5, fluency: 5, completion: 5 });
    setReviewFeedback('');
    setPendingTaskToReview(null);
    let qSource = baseQuestions;
    if (module === 'days') qSource = daysQuestions;
    if (module === 'greetings') qSource = greetingsQuestions;
    if (module === 'numbers') qSource = numbersQuestions;
    if (module === 'pronouns') qSource = pronounsQuestions;
    if (module === 'demo') qSource = demonstrativeQuestions;
    if (module === 'nisba') qSource = nisbaQuestions;
    if (module === 'letters') qSource = arabicLettersQuestions;
    if (module === 'phrases') qSource = commonPhrasesQuestions;
    if (module === 'prepositions') qSource = prepositionsQuestions;
    if (module === 'conjunctions') qSource = conjunctionsQuestions;

    const shuffled = shuffle(qSource);
    setQuestions(shuffled);
    setResponses(shuffled.map(q => ({
      id: q.id,
      studentAnswer: "",
      correctAnswer: q.correct,
      mark: q.mark,
      earned: 0,
      isAnswered: false
    })));
    setCurrentIndex(0);
    setScore(0);
    setEmailSent(false);
    setShowResults(false);
    setScreen(module === 'quest' ? 'quiz' : 'lesson');
  };

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [audioError, setAudioError] = useState<string | null>(null);

  const playFeedback = (type: 'correct' | 'try_again' | 'magnificent' | 'read_again') => {
    const audio = new Audio(`/audio/${type}.mp3`);
    audio.play().catch(err => {
      console.warn(`Could not play feedback audio: ${type}`, err);
      setAudioError(`${t('audioError') || 'Audio Error'}: ${type}.mp3`);
      setTimeout(() => setAudioError(null), 3000);
    });
  };

  const answer = (choice: string) => {
    if (currentResponse.isAnswered) return;

    const newResponses = [...responses];
    const r = newResponses[currentIndex];
    r.studentAnswer = choice;
    r.isAnswered = true;

    if (choice === currentQuestion.correct) {
      r.earned = currentQuestion.mark;
      setScore(prev => round2(prev + currentQuestion.mark));
      
      const newCorrectStreak = correctStreak + 1;
      setCorrectStreak(newCorrectStreak);
      setWrongStreak(0);

      if (newCorrectStreak === 3) {
        playFeedback('magnificent');
      } else if (newCorrectStreak === 5) {
        playFeedback('magnificent');
        setCanSkip(true);
      } else {
        playFeedback('correct');
      }
    } else {
      r.earned = 0;
      const newWrongStreak = wrongStreak + 1;
      setWrongStreak(newWrongStreak);
      setCorrectStreak(0);

      if (newWrongStreak === 3) {
        playFeedback('read_again');
        // Lock and redirect
        setLockedModules(prev => ({
          ...prev,
          [currentModule]: Date.now() + 3 * 60 * 1000
        }));
        setTimeout(() => {
          setScreen('lesson');
        }, 1500);
      } else {
        playFeedback('try_again');
      }
    }

    setResponses(newResponses);
  };

  const skipQuestion = () => {
    if (!canSkip) return;
    setCanSkip(false);
    
    const newResponses = [...responses];
    const r = newResponses[currentIndex];
    r.studentAnswer = "SKIPPED";
    r.isAnswered = true;
    r.earned = currentQuestion.mark; // Give full mark for skip reward
    setScore(prev => round2(prev + currentQuestion.mark));
    setResponses(newResponses);
    
    setTimeout(() => {
      goNext();
    }, 500);
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishGame = () => {
    saveLeaderboardEntry();
    setScreen('writtenTask');
  };

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (screen === 'leaderboard' || screen === 'end') {
      fetchLeaderboard();
    }
  }, [screen]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  const saveLeaderboardEntry = async () => {
    const entry = {
      name: studentName,
      email: studentEmail,
      score: round2(score),
      total: 100,
      date: new Date().toLocaleString()
    };
    
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      fetchLeaderboard();
    } catch (err) {
      console.error("Failed to save leaderboard entry", err);
    }
  };

  useEffect(() => {
    // Redundant lock timer removed
  }, []);

  const sendEmailResult = () => {
    let lines = [];
    lines.push("Student Participation Report");
    lines.push("Designer: " + (lang === 'ar' ? "عثمان مرزوك" : "Othman Marzoog"));
    lines.push("Teacher: " + TEACHER_EMAIL);
    lines.push("");
    lines.push("Student Name: " + studentName);
    lines.push("Student Email: " + studentEmail);
    lines.push("Total Score: " + round2(score) + " / 100");
    if (audioBlob) {
      lines.push("Voice Recording: Completed (Audio recorded during summary reading)");
    }
    lines.push("");
    lines.push("Per-question marks:");
    responses.forEach((r, idx) => {
      lines.push(
        "Q" + (idx + 1) +
        " | Student Answer: " + (r.studentAnswer || "No answer") +
        " | Correct: " + r.correctAnswer +
        " | Mark: " + round2(r.earned) + "/" + r.mark
      );
    });

    const moduleName = currentModule === 'quest' ? 'Arabic Interrogative Quest' : 
                       currentModule === 'days' ? 'Days of the Week' : 
                       currentModule === 'greetings' ? 'Arabic Greetings' : 
                       currentModule === 'numbers' ? 'Arabic Numbers' : 
                       currentModule === 'pronouns' ? 'Arabic Pronouns' : 
                       currentModule === 'demo' ? 'Demonstrative Pronouns' : 
                       currentModule === 'letters' ? 'Arabic Letters' : 
                       currentModule === 'phrases' ? 'Common Arabic Phrases' : 
                       currentModule === 'prepositions' ? 'Arabic Prepositions' : 
                       currentModule === 'conjunctions' ? 'Arabic Conjunctions' : 'Nisba Adjective';

    const subject = encodeURIComponent(`Student Participation and Marks - ${moduleName}`);
    const body = encodeURIComponent(lines.join("\n"));
    setEmailSent(true);
    window.location.href = `mailto:${TEACHER_EMAIL}?cc=${CC_EMAIL}&subject=${subject}&body=${body}`;
  };

  const renderEndScreen = () => (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card"
    >
      <div className="certificate">
        <h2>{t('certTitle')}</h2>
        <p>{t('certText')}</p>
        <div className="name">{studentName}</div>
        <p>{t('certCompleted')}</p>
        <p style={{ fontSize: '1.15rem' }}>
          {showResults ? `${t('totalScore')}: ${round2(score)} / 100` : t('sendFirst')}
        </p>
        <div className="btns" style={{ justifyContent: 'center' }}>
          <button className="primary" onClick={sendEmailResult}>{t('sendEmail')}</button>
          {audioBlob && (
            <button 
              className="secondary" 
              onClick={() => {
                const url = URL.createObjectURL(audioBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `arabic_reading_${studentName.replace(/\s+/g, '_')}.webm`;
                a.click();
              }}
              style={{ background: '#f59e0b', color: '#fff', borderColor: '#d97706' }}
            >
              📥 {lang === 'ar' ? 'تحميل التسجيل الصوتي' : 'Download Voice Recording'}
            </button>
          )}
          <button className="secondary" onClick={() => setShowResults(true)} disabled={!emailSent}>{t('showResults')}</button>
          <button className="secondary" onClick={() => window.print()}>{t('print')}</button>
          <button className="secondary" onClick={() => setShowBackConfirm(true)}>{t('backToHub')}</button>
          <button className="secondary" onClick={() => setScreen('leaderboard')}>{t('leaderboard')}</button>
        </div>
      </div>

      {showResults && (
        <div className="reviewbox">
          <h3 style={{ marginTop: 0 }}>{t('details')}</h3>
          <div className="reviewrow" style={{ fontWeight: 700 }}>
            <div>#</div>
            <div>{t('studentAns')}</div>
            <div>{t('correctAns')}</div>
            <div>{t('earned')}</div>
          </div>
          {responses.map((r, idx) => (
            <div key={idx} className="reviewrow">
              <div>{idx + 1}</div>
              <div className={r.earned > 0 ? "ok" : "bad"}>{r.studentAnswer || "—"}</div>
              <div>{r.correctAnswer}</div>
              <div>{round2(r.earned)} / {r.mark}</div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );

  const renderLeaderboard = () => {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('eliteBoard')}</h2>
        {leaderboard.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>{t('noResults')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('rank')}</th>
                <th>{t('name')}</th>
                <th>{t('score')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((x, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{x.name}</td>
                  <td>{x.score} / {x.total}</td>
                  <td>{x.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="btns">
          <button className="secondary" onClick={() => setScreen('start')}>{t('back')}</button>
        </div>
      </div>
    );
  };

  return (
    <div className="wrap" dir={languages.find(l => l.code === lang)?.dir || 'ltr'}>
      <div className="brand no-print">
        <div className="brandbox">
          <div className="logo">OM</div>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>{t('title')}</h1>
            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
              {isLoggedIn ? `${t('welcome')} ${studentName}` : t('subtitle')}
            </div>
          </div>
        </div>
        <div className="btns" style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="secondary"
            style={{ 
              fontSize: '12px', 
              padding: '4px 8px', 
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)'
            }}
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          {isLoggedIn && (
            <button className="navbtn" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={logout}>{t('logout')}</button>
          )}
        </div>
        {isLoggedIn && (currentModule === 'quest' || currentModule === 'days' || currentModule === 'greetings' || currentModule === 'numbers' || currentModule === 'pronouns' || currentModule === 'demo' || currentModule === 'nisba' || currentModule === 'letters' || currentModule === 'prepositions') && <div className="score no-print">{round2(score)} / 100</div>}

      </div>

      <AnimatePresence>
        {audioError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#fef2f2',
              color: '#991b1b',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              zIndex: 2000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            ⚠️ {audioError}
          </motion.div>
        )}

        {showBackConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card"
              style={{ maxWidth: '400px', textAlign: 'center' }}
            >
              <h3>⚠️ {lang === 'ar' ? 'تنبيه' : 'Warning'}</h3>
              <p>{lang === 'ar' ? 'ستفقد كل تقدمك في هذا الاختبار. هل أنت متأكد من العودة؟' : 'You will lose all your progress in this quiz. Are you sure you want to return?'}</p>
              <div className="btns" style={{ justifyContent: 'center' }}>
                <button className="bad-btn" onClick={() => {
                  setCurrentModule('hub');
                  setShowBackConfirm(false);
                }}>
                  {lang === 'ar' ? 'نعم، عودة' : 'Yes, Return'}
                </button>
                <button className="secondary" onClick={() => setShowBackConfirm(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {!isLoggedIn && (
          <section className="card">
            <div className="hero">
              <form onSubmit={handleLogin} style={{ width: '100%' }}>
                <h2 style={{ marginTop: 0 }}>{t('loginTitle')}</h2>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
                  {t('loginDesc')}
                </p>
                <label>{t('studentName')}</label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? "اكتب اسمك هنا" : "Enter your name"}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
                <label>{t('studentEmail')}</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    style={{ width: 'auto', marginBottom: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {lang === 'ar' ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}
                  </span>
                </div>
                <div className="btns">
                  <button type="submit" className="primary">{t('loginBtn')}</button>
                </div>
              </form>
              <div className="heroart">🌍✨📖</div>
            </div>
          </section>
        )}

        {isLoggedIn && currentModule === 'hub' && (
          <section className="card">
            <h2 style={{ marginTop: 0 }}>{t('hubTitle')}</h2>
            <p style={{ color: 'var(--muted)' }}>{t('hubDesc')}</p>
            
            <div className="module-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {[
                { key: 'letters', icon: '🔤', title: t('partLettersTitle'), desc: t('partLettersDesc') },
                { key: 'greetings', icon: '👋', title: t('part1Title'), desc: t('part1Desc') },
                { key: 'days', icon: '📅', title: t('part2Title'), desc: t('part2Desc') },
                { key: 'quest', icon: '🎯', title: t('part3Title'), desc: t('part3Desc') },
                { key: 'numbers', icon: '🔢', title: t('part4Title'), desc: t('part4Desc') },
                { key: 'pronouns', icon: '👤', title: t('part5Title'), desc: t('part5Desc') },
                { key: 'demo', icon: '👉', title: t('part6Title'), desc: t('part6Desc') },
                { key: 'nisba', icon: '🌍', title: t('part7Title'), desc: t('part7Desc') },
                { key: 'phrases', icon: '💬', title: t('part8Title'), desc: t('part8Desc') },
                { key: 'prepositions', icon: '🔗', title: t('part9Title'), desc: t('part9Desc') },
                { key: 'conjunctions', icon: '🌉', title: t('part10Title'), desc: t('part10Desc') },
                { key: 'reading', icon: '📖', title: t('part11Title'), desc: t('part11Desc') }
              ].map(m => (
                <div 
                  key={m.key}
                  className="module-card" 
                  style={{ 
                    padding: '20px', 
                    border: '1px solid var(--line)', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'var(--card)'
                  }}
                  onClick={() => m.key === 'quest' ? setCurrentModule('quest') : startGame(m.key as any)}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{m.icon}</div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{m.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{m.desc}</p>
                  <button className="primary" style={{ marginTop: '15px', width: '100%' }}>{t('startNow')}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoggedIn && currentModule !== 'hub' && (
          <>
            {screen === 'reading' && (
              <ReadingView 
                t={t} 
                lang={lang} 
                nightIndex={readingNight} 
                onNext={() => setReadingNight(prev => prev + 1)} 
                onFinish={() => {
                  setCurrentModule('hub');
                  setScreen('start');
                }} 
                onBack={() => {
                  setCurrentModule('hub');
                  setScreen('start');
                }}
                studentName={studentName}
                studentEmail={studentEmail}
              />
            )}
            {(screen === 'lesson' || screen === 'start') && (
              <LessonView 
                title={
                  currentModule === 'letters' ? t('partLettersTitle') :
                  currentModule === 'greetings' ? t('part1Title') :
                  currentModule === 'days' ? t('part2Title') :
                  currentModule === 'quest' ? t('part3Title') :
                  currentModule === 'numbers' ? t('part4Title') :
                  currentModule === 'pronouns' ? t('part5Title') :
                  currentModule === 'demo' ? t('part6Title') :
                  currentModule === 'nisba' ? t('part7Title') :
                  currentModule === 'phrases' ? t('part8Title') :
                  currentModule === 'prepositions' ? t('part9Title') :
                  currentModule === 'conjunctions' ? t('part10Title') :
                  t('part11Title')
                }
                desc={
                  currentModule === 'letters' ? t('partLettersDesc') :
                  currentModule === 'greetings' ? t('part1Desc') :
                  currentModule === 'days' ? t('part2Desc') :
                  currentModule === 'quest' ? t('part3Desc') :
                  currentModule === 'numbers' ? t('part4Desc') :
                  currentModule === 'pronouns' ? t('part5Desc') :
                  currentModule === 'demo' ? t('part6Desc') :
                  currentModule === 'nisba' ? t('part7Desc') :
                  currentModule === 'phrases' ? t('part8Desc') :
                  currentModule === 'prepositions' ? t('part9Desc') :
                  currentModule === 'conjunctions' ? t('part10Desc') :
                  t('part11Desc')
                }
                onStart={() => {
                  if (currentModule === 'reading') {
                    setScreen('reading');
                  } else if (currentModule === 'quest') {
                    startGame('quest');
                  } else {
                    setScreen('quiz');
                  }
                }}
              >
                {currentModule === 'letters' && (
                  <>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6 }}>{t('lettersSummary')}</p>
                    </div>
                    <div className="table-wrap" style={{ overflowX: 'auto' }}>
                      <table style={{ minWidth: '600px' }}>
                        <thead>
                          <tr>
                            <th>Letter</th>
                            <th>{t('letterFormIsolated')}</th>
                            <th>{t('letterFormInitial')}</th>
                            <th>{t('letterFormMedial')}</th>
                            <th>{t('letterFormFinal')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Alif', iso: 'أ', ini: 'أ', med: 'ـأ', fin: 'ـأ' },
                            { name: 'Bā’', iso: 'ب', ini: 'بـ', med: 'ـبـ', fin: 'ـب' },
                            { name: 'Tā’', iso: 'ت', ini: 'تـ', med: 'ـتـ', fin: 'ـت' },
                            { name: 'Thā’', iso: 'ث', ini: 'ثـ', med: 'ـثـ', fin: 'ـث' },
                            { name: 'Jīm', iso: 'ج', ini: 'جـ', med: 'ـجـ', fin: 'ـج' },
                            { name: 'Ḥā’', iso: 'ح', ini: 'حـ', med: 'ـحـ', fin: 'ـح' },
                            { name: 'Khā’', iso: 'خ', ini: 'خـ', med: 'ـخـ', fin: 'ـخ' },
                            { name: 'Dāl', iso: 'د', ini: 'د', med: 'ـد', fin: 'ـد' },
                            { name: 'Dhāl', iso: 'ذ', ini: 'ذ', med: 'ـذ', fin: 'ـذ' },
                            { name: 'Rā’', iso: 'ر', ini: 'ر', med: 'ـر', fin: 'ـر' },
                            { name: 'Zāy', iso: 'ز', ini: 'ز', med: 'ـز', fin: 'ـز' },
                            { name: 'Sīn', iso: 'س', ini: 'سـ', med: 'ـسـ', fin: 'ـس' },
                            { name: 'Shīn', iso: 'ش', ini: 'شـ', med: 'ـشـ', fin: 'ـش' },
                            { name: 'Ṣād', iso: 'ص', ini: 'صـ', med: 'ـصـ', fin: 'ـص' },
                            { name: 'Ḍād', iso: 'ض', ini: 'ضـ', med: 'ـضـ', fin: 'ـض' },
                            { name: 'Ṭā’', iso: 'ط', ini: 'طـ', med: 'ـطـ', fin: 'ـط' },
                            { name: 'Ẓā’', iso: 'ظ', ini: 'ظـ', med: 'ـظـ', fin: 'ـظ' },
                            { name: '‘Ayn', iso: 'ع', ini: 'عـ', med: 'ـعـ', fin: 'ـع' },
                            { name: 'Ghayn', iso: 'غ', ini: 'غـ', med: 'ـغـ', fin: 'ـغ' },
                            { name: 'Fā’', iso: 'ف', ini: 'فـ', med: 'ـفـ', fin: 'ـف' },
                            { name: 'Qāf', iso: 'ق', ini: 'قـ', med: 'ـقـ', fin: 'ـق' },
                            { name: 'Kāf', iso: 'ك', ini: 'كـ', med: 'ـكـ', fin: 'ـك' },
                            { name: 'Lām', iso: 'ل', ini: 'لـ', med: 'ـلـ', fin: 'ـل' },
                            { name: 'Mīm', iso: 'م', ini: 'مـ', med: 'ـمـ', fin: 'ـم' },
                            { name: 'Nūn', iso: 'ن', ini: 'نـ', med: 'ـنـ', fin: 'ـن' },
                            { name: 'Hā’', iso: 'ه', ini: 'هـ', med: 'ـهـ', fin: 'ـه' },
                            { name: 'Wāw', iso: 'و', ini: 'و', med: 'ـو', fin: 'ـو' },
                            { name: 'Yā’', iso: 'ي', ini: 'يـ', med: 'ـيـ', fin: 'ـي' }
                          ].map(l => (
                            <tr key={l.name}>
                              <td style={{ fontWeight: 700 }}>{l.name}</td>
                              <td style={{ fontSize: '24px' }}>{l.iso}</td>
                              <td style={{ fontSize: '24px' }}>{l.ini}</td>
                              <td style={{ fontSize: '24px' }}>{l.med}</td>
                              <td style={{ fontSize: '24px' }}>{l.fin}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {currentModule === 'quest' && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <div className="heroart">📚🧠🎯</div>
                    <button className="secondary" onClick={() => setScreen('leaderboard')}>{t('leaderboard')}</button>
                  </div>
                )}
                {currentModule === 'days' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '20px' }}>
                    {[
                      { ar: t('sun'), en: 'Sunday' },
                      { ar: t('mon'), en: 'Monday' },
                      { ar: t('tue'), en: 'Tuesday' },
                      { ar: t('wed'), en: 'Wednesday' },
                      { ar: t('thu'), en: 'Thursday' },
                      { ar: t('fri'), en: 'Friday' },
                      { ar: t('sat'), en: 'Saturday' }
                    ].map(d => (
                      <div key={d.en} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{d.ar}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{d.en}</div>
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'greetings' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    {[
                      { ar: 'السَّلَامُ عَلَيْكُم', en: t('greet1Desc'), key: 'greet1' },
                      { ar: 'صَبَاحُ الْخَيْر', en: t('greet2Desc'), key: 'greet2' },
                      { ar: 'مَسَاءُ الْخَيْر', en: t('greet3Desc'), key: 'greet3' },
                      { ar: 'مَعَ السَّلَامَة', en: t('greet4Desc'), key: 'greet4' },
                      { ar: 'كَيْفَ حَالُكَ؟', en: t('greet5Desc'), key: 'greet5' },
                      { ar: 'شُكْرًا', en: t('greet6Desc'), key: 'greet6' }
                    ].map(item => (
                      <div key={item.key} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--a)' }}>{item.ar}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{item.en}</div>
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'numbers' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '20px' }}>
                    {[t('num1'), t('num2'), t('num3'), t('num4'), t('num5'), t('num6'), t('num7'), t('num8'), t('num9'), t('num10')].map((n, i) => (
                      <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>
                        {n}
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'pronouns' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    {[
                      { title: t('pronounType1'), desc: t('pronounType1Desc') },
                      { title: t('pronounType2'), desc: t('pronounType2Desc') },
                      { title: t('pronounType3'), desc: t('pronounType3Desc') }
                    ].map((p, i) => (
                      <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--a)', marginBottom: '5px' }}>{p.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'demo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    {[
                      { title: t('demo1'), desc: t('demo1Desc') },
                      { title: t('demo2'), desc: t('demo2Desc') },
                      { title: t('demo3'), desc: t('demo3Desc') },
                      { title: t('demo4'), desc: t('demo4Desc') },
                      { title: t('demo5'), desc: t('demo5Desc') }
                    ].map((p, i) => (
                      <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--a)', marginBottom: '5px' }}>{p.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'nisba' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    {[
                      { title: t('nisbaRule1'), desc: t('nisbaRule1Desc') },
                      { title: t('nisbaRule2'), desc: t('nisbaRule2Desc') },
                      { title: t('nisbaRule3'), desc: t('nisbaRule3Desc') }
                    ].map((p, i) => (
                      <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--a)', marginBottom: '5px' }}>{p.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
                {currentModule === 'phrases' && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesBasic')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'مَا اسْمُك؟', sound: 'Ma smuk?', en: 'What’s your name?' },
                          { ar: 'اسْمِي هُو', sound: 'Esmī huwa', en: 'My name is...' },
                          { ar: 'كَيْفَ حَالُك؟', sound: 'Kayfa ħāluk', en: 'How are you?' },
                          { ar: 'أَنَا بِخَيْر', sound: 'Anā bikhayr', en: 'I’m fine' },
                          { ar: 'مِنْ فَضْلِك', sound: 'min Fađlik', en: 'Please' },
                          { ar: 'شُكْرًا لَك', sound: 'Shukran lak', en: 'Thank you' },
                          { ar: 'عَفْوًا', sound: 'ʿafwan', en: 'You’re welcome' },
                          { ar: 'أَنَا آسِف', sound: 'Anā āsif', en: 'I’m sorry' },
                          { ar: 'أَيْنَ الْحَمَّام؟', sound: 'Ayna l ħammām?', en: 'Where is the bathroom?' },
                          { ar: 'مُسَاعَدَة!', sound: 'Mosāʿadah!', en: 'Help!' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesGreetings')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'السَّلَامُ عَلَيْكُم', sound: 'assalāmu ʿalaykum', en: 'May peace be upon you!' },
                          { ar: 'وَعَلَيْكُمُ السَّلَام', sound: 'ʿalaykumu ssalām', en: 'Same to you' },
                          { ar: 'صَبَاحُ الْخَيْر', sound: 'ŝabāu l-khayr', en: 'Good morning' },
                          { ar: 'مَسَاءُ الْخَيْر', sound: 'masā’u l-khayr', en: 'Good afternoon/evening' },
                          { ar: 'سُرِرْتُ بِلِقَائِك', sound: 'surirtu biliqâ`ik', en: 'Pleased to meet you!' },
                          { ar: 'مَعَ السَّلَامَة', sound: 'maʿa s-salāmah', en: 'Good bye' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesFormal')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'حضرتك', sound: 'ħađratuk', en: 'Your Honor (Father/Unknown)' },
                          { ar: 'سيادتك', sound: 'Siyadatuk', en: 'Your Honor (Managers)' },
                          { ar: 'فخامتك', sound: 'fakhâmatuk', en: 'Your Excellency (Presidents)' },
                          { ar: 'سموك', sound: 'sumuwwuk', en: 'Your Highness (Princes)' },
                          { ar: 'جلالتكم', sound: 'jalālatukum', en: 'Your Majesty (Kings)' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesWork')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'مَاذَا تَعْمَل؟', sound: 'Mādhā Taʿamal?', en: 'What do you do?' },
                          { ar: 'مَا مِهْنَتُك؟', sound: 'Ma Mehnatuk', en: 'What is your profession?' },
                          { ar: 'طَبِيب', sound: 'Tabeeb', en: 'Doctor' },
                          { ar: 'مُدَرِّس', sound: 'Mudarris', en: 'Teacher' },
                          { ar: 'سَائِق', sound: 'Sā`iq', en: 'Driver' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesTravel')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'أَنَا تَائِه', sound: 'anā Tā`ih', en: 'I’m lost' },
                          { ar: 'هَلْ تَتَكَلَّم الإِنْجِلِيزِيَّة؟', sound: 'Hal Tatakallam ul-injilīziyyah?', en: 'Do you speak English?' },
                          { ar: 'مَحَطَّة الْقِطَار', sound: 'Maħaŧatu l-qiŧâr', en: 'Train station' },
                          { ar: 'شُرْطَة!', sound: 'Shurŧah!', en: 'Police!' },
                          { ar: 'كَمْ يُكَلِّفُ هَذَا؟', sound: 'Kam yukallif hādhā?', en: 'How much does this cost?' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesFood')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'سَمَكَة', sound: 'samakah', en: 'Fish' },
                          { ar: 'حَلِيب', sound: 'ħalīb', en: 'Milk' },
                          { ar: 'قَمْح', sound: 'Qamħ', en: 'Wheat' },
                          { ar: 'الْفَاتُورَة من فضلك', sound: 'Alfātūrah min fađlik', en: 'The bill, please' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ color: 'var(--a)', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>{t('phrasesLove')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {[
                          { ar: 'أُحِبُّك', sound: 'uħibbuk', en: 'I love you!' },
                          { ar: 'أَفْتَقِدُك', sound: 'Aftaqiduk', en: 'I miss you' },
                          { ar: 'أُحِبُّكَ إِلَى الْأَبَد', sound: 'uħibbuka ila l-abad', en: 'I love you forever' }
                        ].map((p, i) => (
                          <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {currentModule === 'prepositions' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                      {[
                        { ar: 'مِنْ', sound: 'min', en: 'from' },
                        { ar: 'إِلَى', sound: 'ilā', en: 'to, toward' },
                        { ar: 'فِي', sound: 'fī', en: 'in, at' },
                        { ar: 'عَلَى', sound: 'ʿalā', en: 'on, upon' },
                        { ar: 'بِـ', sound: 'bi-', en: 'with, by' },
                        { ar: 'لِـ', sound: 'li-', en: 'for, to' },
                        { ar: 'عَنْ', sound: 'ʿan', en: 'about, from' },
                        { ar: 'كَـ', sound: 'ka-', en: 'like, as' },
                        { ar: 'حَتَّى', sound: 'ḥattā', en: 'until, up to' },
                        { ar: 'مُذْ / مُنْذُ', sound: 'mudh / mundhu', en: 'since, for' }
                      ].map((p, i) => (
                        <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                          <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                        </div>
                      ))}
                    </div>
                  )}
                {currentModule === 'conjunctions' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                      {[
                        { ar: 'وَ', sound: 'wa', en: 'and' },
                        { ar: 'فَـ', sound: 'fa-', en: 'so, then (immediately)' },
                        { ar: 'ثُمَّ', sound: 'thumma', en: 'then (with delay)' },
                        { ar: 'أَوْ', sound: 'aw', en: 'or' },
                        { ar: 'لَكِنْ', sound: 'lakin', en: 'but' },
                        { ar: 'بَلْ', sound: 'bal', en: 'rather, but' },
                        { ar: 'لا', sound: 'lā', en: 'not, nor' },
                        { ar: 'أَمْ', sound: 'am', en: 'or (for choices)' },
                        { ar: 'حَتَّى', sound: 'ḥattā', en: 'until, even' }
                      ].map((p, i) => (
                        <div key={i} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '12px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--a)' }}>{p.ar}</div>
                          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--muted)' }}>{p.sound}</div>
                          <div style={{ fontSize: '14px', marginTop: '4px' }}>{p.en}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </LessonView>
              )}
            {screen === 'quiz' && <QuizView moduleKey={currentModule} />}
            {screen === 'leaderboard' && renderLeaderboard()}
            {screen === 'end' && renderEndScreen()}
            {screen === 'writtenTask' && (
              <WrittenTaskView 
                t={t}
                currentModule={currentModule}
                studentName={studentName}
                studentEmail={studentEmail}
                writtenTaskContent={writtenTaskContent}
                setWrittenTaskContent={setWrittenTaskContent}
                fetchPendingTask={fetchPendingTask}
                setScreen={setScreen}
              />
            )}
            {screen === 'peerReview' && (
              <PeerReviewView 
                t={t}
                lang={lang}
                studentName={studentName}
                studentEmail={studentEmail}
                pendingTaskToReview={pendingTaskToReview}
                reviewScores={reviewScores}
                setReviewScores={setReviewScores}
                reviewFeedback={reviewFeedback}
                setReviewFeedback={setReviewFeedback}
                setScreen={setScreen}
              />
            )}
          </>
        )}
      </AnimatePresence>

      <div className="footer no-print">{t('footer')}</div>
    </div>
  );
}
