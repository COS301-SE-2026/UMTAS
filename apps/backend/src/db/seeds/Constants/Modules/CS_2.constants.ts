import { SeedModule } from './Modules.constants';

//Done
export const FUNDAMENTAL_MODULES_2: SeedModule[] = [
  {
    Code: 'JCP 202',
    Name: 'Community-based project 202',
    Description:
      'The Joint Community Project module is a credit-bearing educational experience where students are not only actively engaging in interpersonal skills development but also participate in service activities in collaboration with community partners. Students are given the opportunity to practice and develop their interpersonal skills formally taught in the module by engaging in teamwork with fellow students from different disciplines and also with non-technical members of the community. The module intends for the student to develop through reflection, understanding of their own experience in a team-based workspace as well as a broader understanding of the application of their discipline knowledge and its potential impact in their communities, in this way also enhancing their sense of civic responsibility. Compulsory class attendance 1 week before Semester 1 classes commence.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
]; //END_FUNDAMENTAL_MODULES_2

//Done
export const CORE_MODULES_2: SeedModule[] = [
  {
    Code: 'COS 212',
    Name: 'Data structures and algorithms 212',
    Description:
      'Data abstraction is a fundamental concept in the design and implementation of correct and efficient software. In prior modules, students are introduced to the basic data structures of lists, stacks and queues. This module continues with advanced data structures such as trees, hash tables, heaps and graphs, and goes into depth with the algorithms needed to manipulate them efficiently. Classical algorithms for sorting, searching, traversing, packing and game playing are included, with an emphasis on comparative implementations and efficiency. At the end of this module, students will be able to identify and recognise all the classical data structures; implement them in different ways; know how to measure the efficiency of implementations and algorithms; and have further developed their programming skills, especially with recursion and polymorphism.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 214',
    Name: 'Software modelling 214',
    Description:
      'The module will introduce the concepts of model-driven analysis and design as a mechanism to develop and evaluate complex software systems. Systems will be decomposed into known entities, such as design patterns, classes, relationships, execution loops and process flow, in order to model the semantic aspects of the system in terms of structure and behaviour. An appropriate tool will be used to support the software modelling. The role of the software model in the enterprise will be highlighted. Students who successfully complete this module will be able to conceptualise and analyse problems and abstract a solution.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 216',
    Name: 'Netcentric computer systems 216',
    Description:
      'This module will introduce the student to netcentric systems by focusing on the development of systems for the web, mobile devices and the cloud. To lay the foundation on which the rest of the module can follow, traditional web-based programming languages such as HTML5, JavaScript, CSS and Python will be covered differentiating between client-side and server-side computation. Persistence of web-based data will be included for both client and server-based computation. These technologies will be extended and applied to mobile platforms where the availability of a connection, location-services and mobile device limitations play a role. For cloud platforms, aspects relating to task partitioning, security, virtualisation, cloud storage and access to the shared data stores, data synchronisation, partitioning and replication are considered. In order to practically demonstrate that a student has reached these outcomes, students will be required to use, integrate and maintain the necessary software and hardware by completing a number of smaller practical assignments where after integrating all these technologies into a comprehensive and practical programming project is required.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 221',
    Name: 'Introduction to database systems 221',
    Description:
      'This module will expose students to the evolution of databases systems. They will be able to model data conceptually, in terms of models such as conceptual, relational, object oriented, graph-based and network and the mapping between models, in particular between the conceptual and relational model. Foundational concepts relating to the relational model will be considered, such as: entity and referential integrity, relational algebra and calculus, functional dependency, normals forms, Indexing of database systems and transaction processing will also form an integral part of the curriculum. The physical data representation of the databases system both in memory and within the file system of the operating system will be considered.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 226',
    Name: 'Concurrent systems 226',
    Description:
      'Computer science courses mostly deal with sequential programs. This module looks at the fundamentals of concurrency; what it means, how it can be exploited, and what facilities are available to determine program correctness. Concurrent systems are designed, analysed and implemented.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 284',
    Name: 'Computer organisation and architecture 284',
    Description:
      'This module provides the foundations on which other modules build by enabling a deeper understanding of how software interacts with hardware. It will teach the design and operation of modern digital computers by studying each of the components that make up a digital computer and the interaction between these components. Specific areas of interest, but not limited to, are: representation of data on the machine-level; organisation of the machine on the assembly level; the architecture and organisation of memory; inter- and intra-component interfacing and communication; data paths and control; and parallelism. Topic-level detail and learning outcomes for each of these areas are given by the first 6 units of Architecture and Organisation knowledge area as specified by the ACM/IEEE Computer Science Curriculum 2013. The concepts presented in the theory lectures will be reinforced during the practical sessions by requiring design and implementation of the concepts in simulators and assembly language using an open source operating system.',
    credits: 16.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'WTW 285',
    Name: 'Discrete structures 285',
    Description:
      'Setting up and solving recurrence relations. Equivalence and partial order relations. Graphs: paths, cycles, trees, isomorphism. Graph algorithms: Kruskal, Prim, Fleury. Finite state automata.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'COS 210',
    Name: 'Theoretical computer science 210',
    Description:
      'This module introduces students to a framework for investigating both computability and complexity of problems. Topics include, but are not limited to: finite-state machines, regular expressions and their application in a language such as awk, the Halting problem, context-free grammars, P vs NP problem, NP-complete class, reduction techniques, regular languages, DFAs and NFAs, Lattices, Church-Turing thesis.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
]; //END_CORE_MODULES_2

//Done
export const ELECTIVE_MODULES_2: SeedModule[] = [
  {
    Code: 'STK 210',
    Name: 'Statistics 210',
    Description:
      'Statistical problem solving. Causality, experimental and observational data. Probability theory. Multivariate random variables. Discrete and continuous probability distributions. Stochastic representations. Measures of association. Expected values and conditional expectation. Simulation techniques. Supporting mathematical concepts. Statistical concepts are demonstrated and interpreted through practical coding and simulation within a data science framework.',
    credits: 20.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'STK 220',
    Name: 'Statistics 220',
    Description:
      'Multivariate probability distributions. Sampling distributions and the central limit theorem. Frequentist and Bayesian inference. Statistical learning and decision theory. Simulation techniques enhancing statistical thinking. Supervised learning: linear regression, estimation and inference. Non-parametric modelling. Supporting mathematical concepts. Statistical algorithms. Statistical concepts are demonstrated and interpreted through practical coding and simulation within a data science framework.',
    credits: 20.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'WST 211',
    Name: 'Mathematical statistics 211',
    Description:
      'Set theory. Probability measure functions. Random variables. Distribution functions. Probability mass functions. Density functions. Expected values. Moments. Moment generating functions. Special probability distributions: Bernoulli, binomial, hypergeometric, geometric, negative binomial, Poisson, Poisson process, discrete uniform, uniform, gamma, exponential, Weibull, Pareto, normal. Joint distributions: Multinomial, extended hypergeometric, joint continuous distributions. Marginal distributions. Independent random variables. Conditional distributions. Covariance, correlation. Conditional expected values. Transformation of random variables: Convolution formula. Order statistics. Stochastic convergence: Convergence in distribution. Central limit theorem. Sources and types of data and characteristics of extremely large or complex data sets. Practical applications. Practical statistical modelling and analysis using statistical computer packages and the interpretation of the output.',
    credits: 24.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
  {
    Code: 'WST 221',
    Name: 'Mathematical statistics 221',
    Description:
      'Stochastic convergence: Asymptotic normal distributions, convergence in probability. Statistics and sampling distributions: Chi-squared distribution. Distribution of the sample mean and sample variance for random samples from a normal population. T-distribution. F-distribution. Beta distribution. Point estimation: Method of moments. Maximum likelihood estimation. Unbiased estimators. Uniform minimum variance unbiased estimators. Cramer-Rao inequality. Efficiency. Consistency. Asymptotic relative efficiency. Bayes estimators. Sufficient statistics. Completeness. The exponential class. Confidence intervals. Test of statistical hypotheses. Reliability and survival distributions. Aims of data analysis (descriptive, inferential and predictive). Stages of conducting a data analysis. Reproducible research. Practical applications. Practical statistical modelling and analysis using statistical computer packages and the interpretation of the output.',
    credits: 24.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 2,
  },
  {
    Code: 'WST 212',
    Name: 'Applications in data science 212',
    Description:
      'Introduction to Databases. Database design and use. Data preparation and extraction: basic SQL queries, SQL joins and subqueries. Statistical modelling using database structures. Aims of data analysis (descriptive, inferential and predictive). Stages of conducting a data analysis to solve real-world problems. Sources and types of data and characteristics of extremely large or complex data sets. Introductory machine learning concepts: bias/variance trade-off, model complexity, cross-validation, regularisation, overfitting/underfitting, precision, recall, F1 score, ROC curve and confusion matrix. Data visualisation, data wrangling, supervised learning (linear, local and logistic regression) and unsupervised learning (k-means clustering). Statistical concepts are demonstrated and interpreted through practical coding and simulation within a data science framework.',
    credits: 12.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 2,
  },
]; //END_ELECTIVE_MODULES_2
