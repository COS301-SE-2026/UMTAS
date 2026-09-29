import { SeedModule } from './Modules.constants';

//Done
const CORE_MODULES_2: SeedModule[] = [
  {
    Code: 'CMY117',
    Name: 'General chemistry 117',
    Description:
      'General introduction to inorganic, analytical and physical chemistry. Atomic structure and periodicity. Molecular structure and chemical bonding using the VSEPR model. Nomenclature of inorganic ions and compounds. Classification of reactions: precipitation, acid-base, redox reactions and gas-forming reactions. Mole concept and stoichiometric calculations concerning chemical formulas and chemical reactions. Principles of reactivity: energy and chemical reactions. Physical behaviour gases, liquids, solids and solutions and the role of intermolecular forces. Rate of reactions: Introduction to chemical kinetics.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'MLB111',
    Name: 'Molecular and cell biology 111',
    Description: '',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'PHY131',
    Name: 'Physics for biology students 131',
    Description:
      'Note: PHY 131 is aimed at students who will not continue with physics. PHY 131 cannot be used as a substitute for PHY 114. Units, vectors, one dimensional kinematics, dynamics, work, equilibrium, sound, liquids, heat, thermodynamic processes, electric potential and capacitance, direct current and alternating current, optics, modern physics, radioactivity.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'WTW134',
    Name: 'Mathematics 134',
    Description:
      '*Students will not be credited for more than one of the following modules for their degree: WTW 134, WTW 165, WTW 114, WTW 158. WTW 134 does not lead to admission to Mathematics at 200 level and is intended for students who require Mathematics at 100 level only. WTW 134 is offered as WTW 165 in the second semester only to students who have applied in the first semester of the current year for the approximately 65 MBChB, or the 5-6 BChD places becoming available in the second semester and who were therefore enrolled for MGW 112 in the first semester of the current year. Functions, derivatives, interpretation of the derivative, rules of differentiation, applications of differentiation, integration, interpretation of the definite integral, applications of integration. Matrices, solutions of systems of equations. All topics are studied in the context of applications.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'BME120',
    Name: 'Biometry 120',
    Description:
      'Simple statistical analysis: Data collection and analysis: Samples, tabulation, graphical representation, describing location, spread and skewness. Introductory probability and distribution theory. Sampling distributions and the central limit theorem. Statistical inference: Basic principles, estimation and testing in the one- and two-sample cases (parametric and non-parametric). Introduction to experimental design. One- and two-way designs, randomised blocks. Multiple statistical analysis: Bivariate data sets: Curve fitting (linear and non-linear), growth curves. Statistical inference in the simple regression case. Categorical analysis: Testing goodness of fit and contingency tables. Multiple regression and correlation: Fitting and testing of models. Residual analysis. Computer literacy: Use of computer packages in data analysis and report writing.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'BOT161',
    Name: 'Plants and society 161',
    Description:
      "Botanical principles of structure and function; diversity of plants; introductory plant systematics and evolution; role of plants in agriculture and food security; principles and applications of plant biotechnology; economical and valuable medicinal products derived from plants; basic principles of plant ecology and their application in conservation and biodiversity management. This content aligns with the United Nation's Sustainable Development Goals of No Poverty, Good Health and Well-being, Climate Action, Responsible Consumption and Production, and Life on Land.",
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'CMY127',
    Name: 'General chemistry 127',
    Description:
      'Theory: General physical-analytical chemistry: Chemical equilibrium, acids and bases, buffers, solubility equilibrium, entropy and free energy, electrochemistry. Organic chemistry: Structure (bonding), nomenclature, isomerism, introductory stereochemistry, introduction to chemical reactions and chemical properties of organic compounds and biological compounds, i.e. carbohydrates and aminoacids. Practical: Molecular structure (model building), synthesis and properties of simple organic compounds.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'GTS161',
    Name: 'Introductory genetics 161',
    Description:
      'Chromosomes and cell division. Principles of Mendelian inheritance: locus and alleles, dominance interactions, extensions and modifications of basic principles. Probability studies. Sex determination and sex linked traits. Pedigree analysis. Genetic linkage and chromosome mapping. Chromosome variation.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'MBY161',
    Name: 'Introduction to microbiology 161',
    Description:
      'The module will introduce the student to the field of Microbiology. Basic Microbiological aspects that will be covered include introduction into the diversity of the microbial world (bacteria, archaea, eukaryotic microorganisms and viruses), basic principles of cell structure and function, microbial nutrition and microbial growth and growth control. Applications in Microbiology will be illustrated by specific examples i.e. bioremediation, animal-microbial symbiosis, plant-microbial symbiosis and the use of microorganisms in industrial microbiology. Wastewater treatment, microbial diseases and food will be introduced using specific examples.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'ZEN161',
    Name: 'Animal diversity 161',
    Description:
      'Animal classification, phylogeny organisation and terminology. Evolution of the various animal phyla, morphological characteristics and life cycles of parasitic and non-parasitic animals. Structure and function of reproductive, respiratory, excretory, circulatory and digestive systems in various animal phyla. In-class discussion will address the sustainable development goals #3, 12, 13, 14 and 15 (Good Health and Well-being, Responsible Consumption and Production, Climate Action, Life Below Water, Life on Land).',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
]; //CORE_MODULES

export const ALL_SEED_MODULES: SeedModule[] = [...CORE_MODULES_2];
