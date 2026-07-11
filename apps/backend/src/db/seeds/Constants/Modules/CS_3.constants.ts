import { SeedModule } from './Modules.constants';

//Done
export const FUNDAMENTAL_MODULES_3: SeedModule[] = []; //END_FUNDAMENTAL_MODULES_3

//Done
export const CORE_MODULES_3: SeedModule[] = [
  {
    Code: 'COS 301',
    Name: 'Software engineering 301',
    Description:
      'The module exposes students to problems associated with software development on an industrial scale. Overall goals of the module are: to become familiar with the latest trends in software engineering; to understand the software engineering process and to appreciate its complexity; to be exposed to a variety of methodologies for tackling different stages of the software lifecycle; to understand and apply the concepts of systems administration and maintenance; to complete the development of a fairly large object orientation-based software product. The focus of the module is on a project that lasts the whole year. The project is completed in groups of approximately four (4) students and teaches students to take responsibility for a variety of roles within a group, and to understand the different requirements for these; to experience the advantages and problems of working in a group; professionalism with regards to particularly colleagues and clients. After the successful completion of this module, the student will be able to: understand the psychology of a client; work in groups; and have an appreciation for planning, designing, implementing and maintaining large projects. These qualities should place the students in a position in which they are able to handle software development in the corporate environment.',
    credits: 27.0,
    Core: true,
    SemesterOfStudy: 'Year-long',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 332',
    Name: 'Computer networks 332',
    Description:
      'The objective of this module is to acquaint the student with the terminology of communication systems and to establish a thorough understanding of exactly how data is transferred in such communication networks, as well as applications that can be found in such environments. The study material includes: concepts and terminology, the hierarchy of protocols according to the OSI and TCP/IP models, protocols on the data level, physical level and network level as well as higher level protocols. The practical component of the module involves programming TCP/IP sockets using a high level language. The emphasis throughout is on the technical aspects underlying the operation of networks, rather than the application of networks.',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 333',
    Name: 'Programming languages 333',
    Description:
      'Programming languages are the backbone for software development. Each language has its own different syntax and semantics, but there are many common concepts that can be studied and then illustrated through the languages. The module concentrates on issues of object orientation, including delegation, iteration and polymorphism. It surveys how languages provide the basic building blocks for data and control, as well as exception handling and concurrency. At the end of the module, students will be able to appreciate the rich history behind programming languages, leading to independent principles that evolve over time. They will be skilled at using a variety of programming languages, including new paradigms such as functional, logical and scripting, and will know how to learn a new language with ease. From this experience, they will be able to apply evaluation criteria for choosing an appropriate programming language in a given scenario.',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 341',
    Name: 'Compiler construction 341',
    Description:
      'This module will introduce the student to the fundamentals of compiler construction. These include: the structural difference between a high-level and a von-Neumann language, the meaning of syntax and semantics and what semantics-preserving correctness means; the concepts of regular expressions, finite automata, context-free grammars in the context of programming languages; the need to construct parse-trees for given programmes; the application of data structures and algorithms for the purpose of code-analysis, code-optimisation and register-allocation; and the limits of code-analysis in terms of undecideability and the halting problem. After successful completion of the module, the student will have an understanding of the importance of compilers and will understand how to implement a compiler, in terms of its components, the scanner, parser, type checker and code-generator for a given grammar.',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 330',
    Name: 'Computer security and ethics 330',
    Description:
      'This module develops an appreciation of the fundamentals and design principles for information assurance and security. Students will develop a clear understanding of the basic information security services and mechanisms, enabling them to design and evaluate the integration of solutions into the user application environment. Emphasis will be placed on services such as authorisation and confidentiality. Students will acquire knowledge and skills of Security Models such as the Bell-LaPadula, Harrison-Ruzzo Ullman and Chinese Wall Model. Students will develop a detailed understanding of the confidentiality service by focusing on cryptology and the practical implementation thereof. The student will be introduced to professional and philosophical ethics. At the end of the module students will be able to engage in a debate regarding the impact (local and global) of computers on individuals, organisations and society. The professionalism of IT staff will be discussed against national and international codes of practices such as those of the CSSA, ACM and IEEE.',
    credits: 18.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
]; //END_CORE_MODULES_3

//Done
export const ELECTIVE_MODULES_3: SeedModule[] = [
  {
    Code: 'COS 314',
    Name: 'Artificial intelligence 314',
    Description:
      'The main objective of this module is to introduce a selection of topics from artificial intelligence (AI), and to provide the student with the background to implement AI techniques for solving complex problems. This module will cover topics from classical AI, as well as more recent AI paradigms. These topics include: search methods, game playing, knowledge representation and reasoning, machine learning, neural networks, genetic algorithms, artificial life, planning methods, and intelligent agents. In the practical part of this module, students will get experience in implementing (1) game trees and evolving game-playing agents; (2) a neural network and applying it to solve a real-world problem; and (3) a genetic algorithm and applying it to solve a real-world problem.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 326',
    Name: 'Database systems 326',
    Description:
      'This module builds on a prior introductory module on database technology and provides more advanced theoretical and practical study material for managing large volumes of data, for example, noSQL database systems and MapReduce. The module will consider file system models, for example Hadoop, relevant for big data storage, manipulation at scale, mining and visualisation. Basic knowledge of parallel decomposition concepts will be included.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'COS 344',
    Name: 'Computer graphics 344',
    Description:
      'The aim of this module is to acquire a sound knowledge of the basic theory of interactive computer graphics and basic computer graphics programming techniques. The theory will cover graphics systems and models, graphics programming, input and interaction, geometric objects and transformations, viewing in 3D, shading, rendering techniques, and introduce advanced concepts, such as object-oriented computer graphics and discrete techniques. The module includes a practical component that enables students to apply and test their knowledge in computer graphics. The OpenGL graphics library and the C programming language will be used for this purpose.',
    credits: 18.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'IMY 310',
    Name: 'Human-computer interaction 310',
    Description:
      '*Closed - requires departmental selection. Human-computer Interaction. This module involves a study of human-computer interaction and human-information interaction; humans as computer and information users; and the ethical aspects relating to the creation of interactive information products. A detailed study of the role, composition and functioning of an interface, underlying principles in the design and evaluation of interfaces, will also be undertaken.',
    credits: 30.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'IMY 320',
    Name: 'Multimedia 320',
    Description:
      '*Closed - requires departmental selection. Trends. This module covers a wide array of themes that relate to how interactive technology is used in the world today. It aims to critically assess the latest design and development trends, and evaluate the benefits and pitfalls associated with these new advances. It is also concerned with the creation of user-centric applications through the implementation of the fundamental design laws of user experience design. The practical component of the module covers video editing tools and the basic skills required to create attractive videos.',
    credits: 30.0,
    Core: false,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'STK 353',
    Name: 'The science of data analytics 353',
    Description:
      'Introduction to coding: data types, basic arithmetic, logical comparisons, functions, loops, conditional statements, packages. Data exploration and visualisation. Visualisation best practices. Data wrangling: data cleaning, missing values, duplicate data, outliers. Data transformation. Principal component analysis. Statistical coding. Algorithmic thinking. Sampling: basic techniques in probability, non-probability, and resampling methods, Monte Carlo, probability integral transformation, bootstrap method, acceptance/rejection algorithm. Machine learning: train/test split, performance metrics, classification and clustering, performance metrics, cross-validation. Supervised and unsupervised learning: linear regression, decision tree, random forest, na\xefve Bayes, K-nearest neighbour, hierarchical clustering. Interpretation and communication of results. Text mining and analytics: topic modelling and word embeddings. Statistical concepts are demonstrated and interpreted through practical coding and simulation within a data science framework.',
    credits: 25.0,
    Core: false,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
]; //END_ELECTIVE_MODULES_3
