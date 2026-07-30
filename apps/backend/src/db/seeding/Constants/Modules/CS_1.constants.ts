import { SeedModule } from './Modules.constants';

//Done
export const FUNDAMENTAL_MODULES_1: SeedModule[] = [
  {
    Code: 'AIM111',
    Name: 'Academic information management 111',
    Description:
      'Find, evaluate, process, manage and present information resources for academic purposes using appropriate technology.',
    credits: 4.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'AIM121',
    Name: 'Academic information management 121',
    Description:
      'Apply effective search strategies in different technological environments. Demonstrate the ethical and fair use of information resources. Integrate 21st-century communications into the management of academic information.',
    credits: 4.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'ALL121',
    Name: 'Academic literacy for Information Technology 121',
    Description:
      'By the end of this module students should be able to cope more confidently and competently with the reading, writing and critical thinking demands that are characteristic of the field of Information Technology.',
    credits: 6.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'UPO112',
    Name: 'Academic orientation 112',
    Description: 'Academic orientation for university students',
    credits: 0.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
]; //FUNDAMENTAL_MODULES

//Done
export const CORE_MODULES_1: SeedModule[] = [
  {
    Code: 'COS110',
    Name: 'Program design: Introduction 110',
    Description:
      'The focus is on object-oriented (OO) programming. Concepts including inheritance and multiple inheritance, polymorphism, operator overloading, memory management (static and dynamic binding), interfaces, encapsulation, reuse, etc. will be covered in the module. The module teaches sound program design with the emphasis on modular code, leading to well structured, robust and documented programs. A modern OO programming language is used as the vehicle to develop these skills. The module will introduce the student to basic data structures, lists, stacks and queues.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'COS151',
    Name: 'Introduction to computer science 151',
    Description:
      'This module introduces concepts and terminology related to the computer science discipline. General topics covered include the history of computing, machine level representation of data, Boolean logic and gates, basic computer systems organisation, algorithms and complexity and automata theory. The module also introduces some of the subdisciplines of computer science, such as computer networks, database systems, compilers, information security and intelligent systems. The module also focues on modelling of algorithms.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW114',
    Name: 'Calculus 114',
    Description: `*This module serves as preparation for students majoring in Mathematics (including all students who intend to enrol for WTW 218 and WTW 220). Students will not be credited for more than one of the following modules for their degree: WTW 114, WTW 158, WTW 134, WTW 165.
                Functions, limits and continuity. Differential calculus of single variable functions, rate of change, graph sketching, applications. The mean value theorem, the rule of L'Hospital. Definite and indefinite integrals, evaluating definite integrals using anti-derivatives, the substitution rule.`,
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW115',
    Name: 'Discrete structures 115',
    Description:
      'Propositional logic: truth tables, logical equivalence, implication, arguments. Mathematical induction and well-ordering principle. Introduction to set theory. Counting techniques: elementary probability, multiplication and addition rules, permutations and combinations, binomial theorem, inclusion-exclusion rule.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW134',
    Name: 'Mathematics 134',
    Description: `*Students will not be credited for more than one of the following modules for their degree: WTW 134, WTW 165, WTW 114, WTW 158. WTW 134 does not lead to admission to Mathematics at 200 level and is intended for students who require Mathematics at 100 level only. WTW 134 is offered as WTW 165 in the second semester only to students who have applied in the first semester of the current year for the approximately 65 MBChB, or the 5-6 BChD places becoming available in the second semester and who were therefore enrolled for MGW 112 in the first semester of the current year. 
            Functions, derivatives, interpretation of the derivative, rules of differentiation, applications of differentiation, integration, interpretation of the definite integral, applications of integration. Matrices, solutions of systems of equations. All topics are studied in the context of applications.`,
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW152',
    Name: 'Mathematical modelling 152',
    Description:
      'The module serves as an introduction to computer programming as used in science. Modelling of dynamical processes using difference equations; curve fitting and linear programming are studied. Applications are drawn from real-life situations in, among others, finance, economics and ecology.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW162',
    Name: 'Dynamical processes 162',
    Description: `*Students will not be credited for more than one of the following modules for their degree: WTW 162 and WTW 264.

            Introduction to the modelling of dynamical processes using elementary differential equations. Solution methods for first order differential equations and analysis of properties of solutions (graphs). Applications to real life situations.`,
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'COS132',
    Name: 'Imperative programming 132',
    Description:
      'This module introduces imperative computer programming, which is a fundamental building block of computer science. The process of constructing a program for solving a given problem, of editing it, compiling (both manually and automatically), running and debugging it, is covered from the beginning. The aim is to master the elements of a programming language and be able to put them together in order to construct programs using types, control structures, arrays, functions and libraries. An introduction to object orientation will be given. After completing this module, the student should understand the fundamental elements of a program, the importance of good program design and user-friendly interfaces. Students should be able to conduct basic program analysis and write complete elementary programs.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW124',
    Name: 'Mathematics 124',
    Description: `*Students will not be credited for more than one of the following modules for their degree:
            WTW 124, WTW 146, WTW 148 and WTW 164. This module serves as preparation for students majoring in Mathematics (including all students who intend to enrol for WTW 218, WTW 211 and WTW 220).

            The vector space Rn, vector algebra with applications to lines and planes, matrix algebra, systems of linear equations, determinants. Complex numbers and factorisation of polynomials. Integration techniques and applications of integration. The formal definition of a limit. The fundamental theorem of Calculus and applications. Vector functions and quadratic curves. `,
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW146',
    Name: 'Linear algebra 146',
    Description: `*Students will not be credited for more than one of the following modules for their degree:
            WTW 124, WTW 146 and WTW 164. The module WTW 146 is designed for students who require Mathematics at 100 level only and does not lead to admission to Mathematics at 200 level.

            Vector algebra, lines and planes, matrix algebra, solution of systems of equations, determinants. Complex numbers and polynomial equations. All topics are studied in the context of applications.`,
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'WTW148',
    Name: 'Calculus 148',
    Description: `*Students will not be credited for more than one of the following modules for their degree:
            WTW 124, WTW 148 and WTW 164. The module WTW 148 is designed for students who require Mathematics at 100 level only and does not lead to admission to Mathematics at 200 level.

            Integration techniques. Modelling with differential equations. Functions of several variables, partial derivatives, optimisation. Numerical techniques. All topics are studied in the context of applications.`,
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'COS122',
    Name: 'Operating systems 122',
    Description:
      'Fundamental concepts of modern operating systems in terms of their structure and the mechanisms they use are studied in this module. After completing this module, students will have gained, as outcomes, knowledge of real time, multimedia and multiple processor systems, as these will be defined and analysed. In addition, students will have gained knowledge on modern design issues of process management, deadlock and concurrency control, memory management, input/output management, file systems and operating system security. In order to experience a hands-on approach to the knowledge students would have gained from studying the abovementioned concepts, students will have produced a number of practical implementations of these concepts using the Windows and Linux operating systems.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
]; //CORE_MODULES

//Done
export const ELECTIVE_MODULES_1: SeedModule[] = [
  {
    Code: 'BOT161',
    Name: 'Plants and society 161',
    Description:
      'Botanical principles of structure and function; diversity of plants; introductory plant systematics and evolution; role of plants in agriculture and food security; principles and applications of plant biotechnology; economical and valuable medicinal products derived from plants; basic principles of plant ecology and their application in conservation and biodiversity management. This content aligns with the United Nations Sustainable Development Goals of No Poverty, Good Health and Well-being, Climate Action, Responsible Consumption and Production, and Life on Land.',
    credits: 8.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'CMY117',
    Name: 'General chemistry 117',
    Description:
      'General introduction to inorganic, analytical and physical chemistry. Atomic structure and periodicity. Molecular structure and chemical bonding using the VSEPR-model. Nomenclature of inorganic ions and compounds. Classification of reactions: precipitation, acid-base, redox reactions and gas-forming reactions. Mole concept and stoichiometric calculations concerning chemical formulas and chemical reactions. Principles of reactivity: energy and chemical reactions. Physical behaviour gases, liquids, solids and solutions and the role of intermolecular forces. Rate of reactions: Introduction to chemical kinetics.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'CMY127',
    Name: 'General chemistry 127',
    Description:
      'Theory: General physical-analytical chemistry: Chemical equilibrium, acids and bases, buffers, solubility equilibrium, entropy and free energy, electrochemistry. Organic chemistry: Structure (bonding), nomenclature, isomerism, introductory stereochemistry, introduction to chemical reactions and chemical properties of organic compounds and biological compounds, i.e. carbohydrates and aminoacids. Practical: Molecular structure (model building), synthesis and properties of simple organic compounds.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'GGY156',
    Name: 'Aspects of human geography 156',
    Description:
      'This module begins by fostering an understanding of human geography. Then follows with the political ordering of space; cultural diversity as well as ethnic geography globally and locally; population geography of the world and South Africa: and four economic levels of development. The purpose is to place South Africa in a world setting and to understand the future of the country.',
    credits: 8.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'GMC110',
    Name: 'Cartography 110',
    Description:
      'History, present and future of cartography. Introductory geodesy: shape of the earth, graticule and grids, datum definition, elementary map projection theory, spherical calculations. Representation of geographical data on maps: Cartographic design, cartographic abstraction, levels of measurement and visual variables. Semiotics for cartography: signs, sign systems, map semantics and syntactics, explicit and implicit meaning of maps (map pragmatics). Critique maps of indicators to measure United Nations Sustainable Development Goals in South Africa.',
    credits: 10.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'MBY161',
    Name: 'Introduction to microbiology 161',
    Description:
      'The module will introduce the student to the field of Microbiology. Basic Microbiological aspects that will be covered include introduction into the diversity of the microbial world (bacteria, archaea, eukaryotic microorganisms and viruses), basic principles of cell structure and function, microbial nutrition and microbial growth and growth control. Applications in Microbiology will be illustrated by specific examples i.e. bioremediation, animal-microbial symbiosis, plant-microbial symbiosis and the use of microorganisms in industrial microbiology. Wastewater treatment, microbial diseases and food will be introduced using specific examples.',
    credits: 8.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'MLB111',
    Name: 'Molecular and cell biology 111',
    Description:
      'Introduction to the molecular structure and function of the cell. Basic chemistry of the cell. Structure and composition of prokaryotic and eukaryotic cells. Ultrastructure and function of cellular organelles, membranes and the cytoskeleton. General principles of energy, enzymes and cell metabolism. Selected processes, e.g. glycolysis, respiration and/or photosynthesis. Introduction to molecular genetics: DNA structure and replication, transcription, translation. Cell growth and cell division.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'PHY131',
    Name: 'Physics for biology students 131',
    Description:
      'PHY 131 is aimed at students who will not continue with physics. PHY 131 cannot be used as a substitute for PHY 114. Units, vectors, one dimensional kinematics, dynamics, work, equilibrium, sound, liquids, heat, thermodynamic processes, electric potential and capacitance, direct current and alternating current, optics, modern physics, radioactivity.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'SCI154',
    Name: 'Exploring the universe 154',
    Description:
      "Students from all faculties are welcome to join us in our exploration of the universe from an earth-bound perspective. We reflect on the whole universe from the sub microscopic to the vast macroscopic and mankind's modest position therein. To what degree is our happiness determined by stars? Echoes from ancient firmaments - the astronomy of old civilisations. The universe is born with a bang. Stars, milky ways and planets are formed. Life is breathed into the landscape on earth, but is there life elsewhere? The architecture of the universe – distance measurements, structure of our solar system and systems of stars. How does it look like on neighbouring planets? Comets and meteorites. Life cycles of stars. Spectacular exploding stars! Exotica like pulsars and black holes.",
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'STK110',
    Name: 'Statistics 110',
    Description:
      "PART A: Mathematical concepts for the business student: Statistical applications of quantitative techniques. Systems of linear equations: solving and application. Differentiation: Rules and application using the rules. Optimisation, linear functions, non-linear functions, Integration: Rules and application using the rules, Marginal and total functions, Stochastic and deterministic variables in a statistical and practical context: producers' and consumers' surplus. Linear programming. Matrix algebra. Limits and continuity. PART B: Descriptive statistics: Sampling and the collection of data; frequency distributions and graphical representations. Descriptive measures of location and dispersion. Probability. Introductory probability theory and theoretical distributions. Statistical and mathematical concepts are demonstrated and interpreted through Excel (practical coding) and simulation within a data science framework. Exam entrance requires a subminimum of 40% in both Part A and Part B. To pass the module a student has to pass both Part A and Part B.",
    credits: 13.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'STK120',
    Name: 'Statistics 120',
    Description:
      'Students can only get credit for one of the following three modules: STK 120 or STK 121 or STC 121. These are terminating modules. Sampling distributions. Estimation theory, i.e. point estimation and confidence intervals. Hypothesis testing of sampling averages and proportions (one and two-sample cases). Non-parametric methods. Analysis of variance. Categorical data analysis. Curve fitting and regression analysis. The analysis of time series. Statistical concepts are demonstrated and interpreted through Excel (practical coding) and simulation within a data science framework.',
    credits: 13.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'WST111',
    Name: 'Mathematical statistics 111',
    Description:
      'Aims of data analysis (descriptive, inferential and predictive). Stages of conducting a data analysis. Sources and types of data. Reproducible research. Characterisation of a set of measurements: Graphical and numerical methods. Random sampling. Probability theory. Discrete and continuous random variables. Probability distributions. Generating functions and moments.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'WST121',
    Name: 'Mathematical statistics 121',
    Description:
      'Sampling distributions and the central limit theorem. Statistical inference: Point and interval estimation. Hypothesis testing with applications in one and two-sample cases. Introductory methods for: Linear regression and correlation, analysis of variance, categorical data analysis and non-parametric statistics. Identification, use, evaluation and interpretation of statistical computer packages and statistical techniques.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'ENV101',
    Name: 'Introduction to environmental sciences 101',
    Description:
      'Introducing the basic concepts and interrelationships required to understand the complexity of natural environmental problems, covering an introduction to environmental science and biogeography; including a first introduction to SDGs and Aichi targets.',
    credits: 8.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'GLY155',
    Name: 'Introduction to geology 155',
    Description:
      'Solar system; structure of solid matter; minerals and rocks; introduction to symmetry and crystallography; important minerals and solid solutions; rock cycle; classification of rocks. External geological processes (gravity, water, wind, sea, ice) and their products (including geomorphology). Internal structure of the earth. The dynamic earth – volcanism, earthquakes, mountain building – the theory of plate tectonics. Geological processes (magmatism, metamorphism, sedimentology, structural geology) in a plate tectonic context. Geological maps and mineral and rock specimens. Interaction between man and the environment, and nature of anthropogenic climate change.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'PHY114',
    Name: 'First course in physics 114',
    Description:
      "SI-units. Significant figures. Waves: intensity, superposition, interference, standing waves, resonance, beats, Doppler. Geometrical optics: Reflection, refraction, mirrors, thin lenses, instruments. Physical optics: Young-interference, coherence, diffraction, polarisation. Hydrostatics and dynamics: density, pressure, Archimedes' principle, continuity, Bernoulli. Heat: temperature, specific heat, expansion, heat transfer. Vectors. Kinematics of a point: Relative, projectile, and circular motion. Dynamics: Newton's laws, friction. Work: point masses, gasses (ideal gas law), gravitation, spring, power. Kinetic energy: Conservative forces, gravitation, spring. Conservation of energy. Conservation of momentum. Impulse and collisions. System of particles: Centre of mass, Newton's laws. Rotation: torque, conservation of angular momentum, equilibrium, centre of gravity.",
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'PHY124',
    Name: 'First course in physics 124',
    Description:
      "Simple harmonic motion and pendulums. Coulomb's law. Electric field: dipoles, Gauss' law. Electric potential. Capacitance. Electric currents: resistance, resistivity, Ohm's law, energy, power, emf, RC-circuits. Magnetic Field: Hall-effect, Bio-Savart. Faraday's and Lenz's laws. Oscillations: LR-circuits. Alternating current: RLC-circuits, power, transformers. Introductory concepts to modern physics. Nuclear physics: Radioactivity.",
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'GLY163',
    Name: 'Earth history 163',
    Description:
      'This module will give an overview of earth history, from the Archaean to the present. Important concepts such as the principles of stratigraphy and stratigraphic nomenclature, geological dating and international and South African time scales will be introduced. A brief introduction to the principles of palaeontology will be given, along with short descriptions of major fossil groups, fossil forms, ecology and geological meaning. In the South African context, the major stratigraphic units, intrusions and tectonic/metamorphic events will be detailed, along with related rock types, fossil contents, genesis and economic commodities. Anthropogenic effects on the environment and their mitigation. Practical work will focus on the interpretation of geological maps and profiles.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
  {
    Code: 'STC122',
    Name: 'Statistics 122',
    Description:
      'Introduction to data and exploratory data analysis: Graphical representations and descriptive measures for numerical and categorical data; relationships between explanatory and response variables; data transformations. Foundations of inference: Simulation; sampling with and without replacement; confidence intervals with bootstrapping; hypothesis testing with randomization; inference with mathematical models (normal distribution and central limit theorem). Statistical inference: Inference for a single proportion, for comparing two proportions, for two-way tables, for a single mean, for comparing two independent means, for comparing paired means, and for comparing many means. Regression and inferential modelling: Correlation; simple linear regression models with numerical or categorical predictors; least squares regression; residual analysis; goodness-of-fit; outliers; prediction and extrapolation; inference. All module content is demonstrated and interpreted through practical coding and simulation within a data science framework. This module may be also presented as a Summer school for students who passed STK 120 or its equivalent with a final mark of at least 60% in Semester 2 of the prior year as well as for students who failed STC 122 during Semester 2 of the prior year.',
    credits: 13.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 1,
  },
  {
    Code: 'GGY168',
    Name: 'Introduction to physical geography 168',
    Description:
      'Note: Students cannot register for both GGY 168 and GGY 166. This module serves as an introduction to the field of physical geography and geomorphology. Initially, a theoretical overview of a variety of geomorphic realms will be studied. Students will be taught about the key processes that are present in each realm and how those processes work together in order to produce specific landforms. In addition, students will receive training in several fundamental analytical techniques, including cartographic skills, aerial photographs and introductory GIS.',
    credits: 16.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 1,
  },
]; //ELECTIVEMODULES

export const ALL_SEED_MODULES: SeedModule[] = [
  ...FUNDAMENTAL_MODULES_1,
  ...CORE_MODULES_1,
  ...ELECTIVE_MODULES_1,
];
