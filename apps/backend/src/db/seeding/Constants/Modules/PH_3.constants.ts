import { SeedModule } from './Modules.constants';

//Done
const CORE_MODULES_3: SeedModule[] = [
  {
    Code: 'BCM251',
    Name: 'Introduction to proteins and enzymes 251',
    Description:
      'Structural and ionic properties of amino acids. Peptides, the peptide bond, primary, secondary, tertiary and quaternary structure of proteins. Interactions that stabilise protein structure, denaturation and renaturation of proteins. Introduction to methods for the purification of proteins, amino acid composition, and sequence determinations. Enzyme kinetics and enzyme inhibition. Allosteric enzymes, regulation of enzyme activity, active centres and mechanisms of enzyme catalysis. Examples of industrial applications of enzymes and in clinical pathology as biomarkers of diseases. Online activities include introduction to practical laboratory techniques and Good Laboratory Practice; techniques for the quantitative and qualitative analysis of biological molecules; enzyme activity measurements; processing and presentation of scientific data.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'BCM257',
    Name: 'Introductory biochemistry 257',
    Description:
      'Chemical foundations. Weak interactions in aqueous systems. Ionisation of water, weak acids and weak bases. Buffering against pH changes in biological systems. Water as a reactant and function of water. Carbohydrate structure and function. Biochemistry of lipids and membrane structure. Nucleotides and nucleic acids. Other functions of nucleotides: energy carriers, components of enzyme cofactors and chemical messengers. Introduction to metabolism. Bioenergetics and biochemical reaction types. Online activities include introduction to laboratory safety and Good Laboratory Practice; basic biochemical calculations; experimental method design and scientific controls, processing and presentation of scientific data.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'FLG211',
    Name: 'Introductory and neurophysiology 211',
    Description:
      'Orientation in physiology, homeostasis, cells and tissue, muscle and neurophysiology, cerebrospinal fluid and the special senses. Practical work: Practical exercises to complement the theory.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'FLG212',
    Name: 'Circulatory physiology 212',
    Description:
      'Body fluids; haematology; cardiovascular physiology and the lymphatic system. Practical work: Practical exercises to complement the theory.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'GTS251',
    Name: 'Molecular genetics 251',
    Description:
      'The chemical nature of DNA. The processes of DNA replication, transcription, RNA processing, translation. Control of gene expression in prokaryotes and eukaryotes. Recombinant DNA technology and its applications in gene analysis and manipulation.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'BCM252',
    Name: 'Carbohydrate metabolism 252',
    Description:
      'Carbohydrate structure and function. Blood glucose measurement in the diagnosis and treatment of diabetes. Bioenergetics and biochemical reaction types. Glycolysis, gluconeogenesis, glycogen metabolism, pentose phosphate pathway, citric acid cycle and electron transport. Total ATP yield from the complete oxidation of glucose. A comparison of cellular respiration and photosynthesis. Online activities include techniques for the study and analysis of metabolic pathways and enzymes; PO ratio of mitochondria, electrophoresis, extraction, solubility and gel permeation techniques; scientific method and design.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'FLG221',
    Name: 'Lung and renal physiology, acid-base balance and temperature 221',
    Description:
      'Structure, gas exchange and non-respiratory functions of the lungs; structure, excretory and non-urinary functions of the kidneys, acid-base balance, as well as the skin and body temperature control. Practical work: Practical exercises to complement the theory.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'FLG222',
    Name: 'Physiology 222',
    Description:
      'Nutrition, digestion and metabolism; hormonal control of the body functions and the reproductive systems. Practical work: Practical exercises to complement the theory.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'GTS261',
    Name: 'Genetic diversity and evolution 261',
    Description:
      'Chromosome structure and transposable elements. Mutation and DNA repair. Genomics and proteomics. Organelle genomes. Introduction to genetic analysis of populations: allele and genotypic frequencies, Hardy Weinberg Law, its extensions and implications for different mating systems. Introduction to quantitative and evolutionary genetics.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
]; //CORE_MODULES

//Done
const ELECTIVE_MODULES_3: SeedModule[] = [
  {
    Code: 'CMY282',
    Name: 'Physical chemistry 282',
    Description:
      'Theory: Classical chemical thermodynamics, gases, first and second law and applications, physical changes of pure materials and simple compounds. Phase rule: Chemical reactions, chemical kinetics, rates of reactions.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'CMY284',
    Name: 'Organismic chemistry 284',
    Description:
      'Resonance, conjugation and aromaticity. Acidity and basicity. Introduction to 13C NMR spectroscopy. Electrophilic addition: alkenes. Nucleophilic substitution, elimination, addition: alkyl halides, alcohols, ethers, epoxides, carbonyl compounds: ketones, aldehydes, carboxylic acids and their derivatives. Training in an ethical approach to safety that protects self, others and the environment is integral to the practical component of the course.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'MBY251',
    Name: 'Bacteriology 251',
    Description:
      'Growth, replication and survival of bacteria. Energy sources, harvesting from light versus oxidation, regulation of catabolic pathways, chemotaxis. Nitrogen metabolism, iron-scavenging. Alternative electron acceptors: denitrification, sulphate reduction, methanogenesis. Bacterial evolution, systematic and genomics. Biodiversity; bacteria occurring in the natural environment (soil, water and air), associated with humans, animals, plants, and those of importance in foods and in the water industry.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'ZEN251',
    Name: 'Invertebrate biology 251',
    Description:
      'Origin and extent of modern invertebrate diversity; parasites of man and domestic animals; biology and medical importance of arachnids and insects; insect life styles; the influence of the environment on insect life histories; insect herbivory; predation and parasitism; insect chemical, visual, and auditory communication. Examples used in the module are relevant to the sustainable development goals of Life on Land and Good Health and Well-being.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'BCM261',
    Name: 'Lipid and nitrogen metabolism 261',
    Description:
      'Biochemistry of lipids, membrane structure, anabolism and catabolism of lipids. Total ATP yield from the complete catabolism of lipids. Electron transport chain and energy production through oxidative phosphorylation. Nitrogen metabolism, amino acid biosynthesis and catabolism. Biosynthesis of neurotransmitters, pigments, hormones and nucleotides from amino acids. Catabolism of purines and pyrimidines. Therapeutic agents directed against nucleotide metabolism. Examples of inborn errors of metabolism of nitrogen containing compounds. The urea cycle, nitrogen excretion. Online activities include training in scientific reading skills; evaluation of a scientific report; techniques for separation analysis and visualisation of biological molecules; hypothesis design and testing, method design and scientific controls.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'BOT261',
    Name: 'Plant physiology and biotechnology 261',
    Description:
      'Nitrogen metabolism in plants; nitrogen fixation in Agriculture; plant secondary metabolism and natural products; photosynthesis and carbohydrate metabolism in plants; applications in solar energy; plant growth regulation and the Green Revolution; plant responses to the environment; developing abiotic stress tolerant and disease resistant plants. Practicals: Basic laboratory skills in plant physiology; techniques used to investigate nitrogen metabolism, carbohydrate metabolism, pigment analysis, water transport in plant tissue and response of plants to hormone treatments.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'CMY283',
    Name: 'Analytical chemistry 283',
    Description:
      'Statistical evaluation of data in line with ethical practice, gravimetric analysis, aqueous solution chemistry, chemical equilibrium, precipitation, neutralisation- and complex formation titrations, redox titrations, potentiometric methods, introduction to electrochemistry. Examples throughout the course demonstrate the relevance of the theory to meeting the sustainable development goals of clean water and clean, affordable energy.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'CMY285',
    Name: 'Inorganic chemistry 285',
    Description:
      'Atomic structure, structure of solids (ionic model). Coordination chemistry of transition metals: Oxidation states of transition metals, ligands, stereochemistry, crystal field theory, consequences of d-orbital splitting, electrochemical properties of transition metals in aqueous solution. Fundamentals of spectroscopy and introduction to IR spectroscopy. During practical training students learn to acquire and report data ethically. Practical training also deals with the misuse of chemicals and appropriate waste disposal to protect the environment and meet the UN sustainable development goals.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'MBY261',
    Name: 'Mycology 261',
    Description:
      'Organisation and molecular architecture of fungal thalli, chemistry of the fungal cell. Chemical and physiological requirements for growth and nutrient acquisition. Mating and meiosis; spore development; spore dormancy, dispersal and germination. Fungi as saprobes in soil, air, plant, aquatic and marine ecosystems; role of fungi as decomposers and in the deterioration of materials; fungi as predators and parasites; mycoses, mycotisms and mycotoxicoses; fungi as symbionts of plants, insects and animals. Applications of fungi in biotechnology.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'MBY262',
    Name: 'Food microbiology 262',
    Description:
      'Primary sources of microorganisms in food. Factors affecting the growth and survival of microorganisms in food. Microbial quality, spoilage and safety of food. Different organisms involved, their isolation, screening and detection. Conventional approaches, alternative methods rapid methods. Food fermentations: fermentation types, principles and organisms involved.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'ZEN261',
    Name: 'African vertebrates 261',
    Description:
      'Introduction to general vertebrate diversity; African vertebrate diversity; vertebrate structure and function; vertebrate evolution; vertebrate relationships; aquatic vertebrates; terrestrial ectotherms; terrestrial endotherms; vertebrate characteristics; classification; structural adaptations; habits; habitats; conservation problems; impact of humans on other vertebrates. The module addresses the sustainable development goals of Life below Water and Life on Land.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
]; //ELECTIVE_MODULES

export const ALL_SEED_MODULES: SeedModule[] = [
  ...CORE_MODULES_3,
  ...ELECTIVE_MODULES_3,
];
