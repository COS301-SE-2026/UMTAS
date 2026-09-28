import { SeedModule } from './Modules.constants';

//Done
const CORE_MODULES_4: SeedModule[] = [
  {
    Code: 'FLG327',
    Name: 'Higher neurological functions 327',
    Description:
      'Overview of higher cognitive functions and the relations between psyche, brain and the immune system. Practical work: Applied practical work with specific examples drawn from South African case studies taught within the framework of the UN Sustainable Development Goal 3 (Good Health and Well-being).',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'FLG330',
    Name: 'Cellular and developmental physiology 330',
    Description:
      'During this module the biology of cellular processes such as the cell cycle, cell death, migration and their related cellular signalling pathways will be discussed as well as their role in early stage embryology and age-related pathologies. Practical work: Exposure to applied molecular biology techniques with specific examples drawn from South African case studies taught within the framework of the UN Sustainable Development Goal of Good Health and Well-being (Sustainable Development Goal 3).',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'FLG331',
    Name: 'Exercise and nutrition science 331',
    Description:
      'Mechanisms of muscle contraction and energy sources. Cardio-respiratory changes, thermo-regulation and other adjustments during exercise. Use and misuse of substances to improve performance. Practical work: Applied practical work with exercise descriptions for the South African context taught within the framework of the UN Sustainable Development Goal 3 (Good Health and Well-being).',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 4,
  },
  {
    Code: 'FLG332',
    Name: 'Applied and pathophysiology 332',
    Description:
      'Integration of all the human physiological systems. Practical work: Applied practical work.',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 4,
  },
]; //CORE_MODULES

//Done
const ELECTIVE_MODULES_4: SeedModule[] = [
  {
    Code: 'BCM356',
    Name: 'Macromolecules of life: structure-function and bioinformatics 356',
    Description:
      'Structure, function, bioinformatics and biochemical analysis of (oligo)nucleotides, amino acids, proteins and ligands - and their organisation into hierarchical, higher order, interdependent structures. Principles of structure-function relationships, protein folding, sequence motifs and domains, higher order and supramolecular structure, self-assembly, conjugated proteins, post-translational modifications. Molecular recognition between proteins, ligands, DNA and RNA or any combinations. The RNA structural world, RNAi, miRNA and ribosomes. Cellular functions of coding and non-coding nucleic acids. Basic principles of mass spectrometry, nuclear magnetic resonance spectroscopy, X-ray crystallography and proteomics. Protein purification and characterisation including, pI, molecular mass, amino acid composition and sequence. Mechanistic aspects and regulation of information flow from DNA via RNA to proteins and back. Practical training includes hands-on nucleic acid purification and sequencing, protein production and purification, analysis by SDS-PAGE or mass spectrometry, protein structure analysis and 3D protein modelling.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'BCM357',
    Name: 'Biocatalysis and integration of metabolism 357',
    Description:
      'Regulation of metabolic pathways. Analysis of metabolic control. Elucidation of metabolic pathways with isotopes. Metabolomics. Coordinated regulation of glycolysis/gluconeogenesis and glycogen breakdown/synthesis. Overview of hormone action. Metabolism of xenobiotics. Hormonal regulation of fuel metabolism. Metabolic adaptions during diabetes. Obesity and the regulation of body mass. Obesity, metabolic syndrome and Type 2 diabetes (T2D). Management of T2D with diet, exercise and medication. Practical sessions cover tutorials on case studies and biochemical calculations, and hands-on isolation of an enzyme, determination of pH and temperature optima, determination of Km and Vmax, enzyme activation and enzyme inhibition.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'BOT356',
    Name: 'Plant ecophysiology 356',
    Description:
      'Introduction to plant ecophysiology and plants response to environmental stress. Understanding how various biotic and abiotic factors affect plant metabolic processes, including photosynthesis and respiration. Emphasis is placed on the efficiency of the mechanisms whereby C3-, C4 and CAM-plants bind CO2 and how they are impacted by the environment. To understand the functioning of plants in diverse environments, the relevant structural properties of plants, the impact of soil composition, water flow in the soil-plant air continuum and long distance transport of assimilates will be discussed. Students will research a topic relevant to plant ecophysiology and present this in the form of an oral presentation. Students will conduct a practical project to study the effects of environmental factors on C3 and C4 plant growth and physiology. Students will present the report in a written format according to the guidelines of a relevant scientific journal. Relevant readings will be used to highlight the alignment of the module with the Sustainable Development Goals, with emphasis placed on climate action.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'CMY382',
    Name: 'Physical chemistry 382',
    Description:
      'Theory: Molecular quantum mechanics. Introduction: Shortcomings of classical physics, dynamics of microscopic systems, quantum mechanical principles, translational, vibrational and rotational movement. Atomic structure and spectra: Atomic hydrogen, multiple electron systems, spectra of complex atoms, molecular structure, the hydrogen molecule ion, diatomic and polyatomic molecules, structure and properties of molecules. Molecules in motion: Viscosity, diffusion, mobility. Surface chemistry: Physisorption and chemisorption, adsorption isotherms, surface tension, heterogeneous catalytic rate reactions, capillarity.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'CMY385',
    Name: 'Inorganic chemistry 385',
    Description:
      'Theory: Structure and bonding in inorganic chemistry. Molecular orbital approach, diatomic and polyatomic molecules, three-centre bonds, metal-metal bonds, transition metal complexes, magnetic properties, electronic spectra, acid-base concepts, non-aqueous solvents, special topics.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'FAR381',
    Name: 'Pharmacology 381',
    Description:
      'The undergraduate pharmacology module introduces students to general pharmacological principles, routes of administration, pharmacokinetics and pharmacodynamics. Furthermore, disease treatment with relation to disorders of the cardiovascular, inflammatory and autonomic nervous system is discussed, as well as anaesthesia, asthma, diabetes, diuresis, obesity and pain.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'GTS351',
    Name: 'Eukaryotic gene control and development 351',
    Description:
      'Regulation of gene expression in eukaryotes: regulation at the genome, transcription, RNA processing and translation levels. DNA elements and protein factors involved in gene control. The role of chromatin structure and epigenetic changes. Technology and experimental approaches used in studying eukaryotic gene control. Applications of the principles of gene control in e.g. cell signaling pathways, development cancer and other diseases in humans.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'GTS367',
    Name: 'Population and evolutionary genetics 367',
    Description:
      'Processes that affect genetic evolution: mutation, drift, natural selection and recombination. Fisher-Wright and coalescence models. Groupings of genes: linkage, inbreeding, population structure and gene flow. Neutral and nearly neutral theory. Quantitative genetics and the phenotype. Optimality. Adaptation. Levels of selection in sex ratios and conflict. Reproductive value and life history. Relatedness and kin selection. Sexual reproduction and selection. Genomic complexity and neutrality.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'MBY351',
    Name: 'Virology 351',
    Description:
      'Introduction to the viruses as a unique kingdom inclusive of their different hosts, especially bacteria, animals and plants; RNA and DNA viruses; viroids, tumour viruses and oncogenes, mechanisms of replication, transcription and protein synthesis; effect on hosts; viral immunology; evolution of viruses.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'MBY355',
    Name: 'Bacterial genetics 355',
    Description:
      'DNA replication and replication control. DNA recombination. DNA damage and repair. Genetics of bacteriophages, plasmids and transposons. Bacterial gene expression control at the transcriptional, translational and post-translational levels. Global regulation and compartmentalisation.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'ZEN351',
    Name: 'Population ecology 351',
    Description:
      'Scientific approach to ecology; evolution and ecology; the individual and its environment; population characteristics and demography; competition; predation; plant-herbivore interactions; regulation of populations; population manipulation, human population. Examples throughout the module are relevant to the sustainable development goals of Life on Land and Good Health and Well-being.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
  {
    Code: 'ZEN352',
    Name: 'Mammalogy 352',
    Description:
      'Mammalian origins and their characteristics: evolution of African mammals; structure and function: integument, support and movement; foods and feeding; environmental adaptations; reproduction; behaviour; ecology and biogeography; social behaviour; sexual selection; parental care and mating systems; community ecology; zoogeography. Special topics: parasites and diseases; domestication and domesticated mammals; conservation. The module addresses the sustainable development goals of Life on Land and Good Health and Well-being.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 4,
  },
]; //ELECTIVE_MODULES

export const ALL_SEED_MODULES: SeedModule[] = [
  ...CORE_MODULES_4,
  ...ELECTIVE_MODULES_4,
];
