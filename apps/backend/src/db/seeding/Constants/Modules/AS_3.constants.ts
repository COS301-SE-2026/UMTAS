import { SeedModule } from './Modules.constants';

//Done
const CORE_MODULES_3: SeedModule[] = [
  {
    Code: 'BME210',
    Name: 'Biometry 210',
    Description:
      'Analysis of variance: Multi-way classification. Testing of model assumptions, graphics. Multiple comparisons. Fixed, stochastic and mixed effect models. Block experiments. Estimation of effects. Experimental design: Principles of experimental design. Factorial experiments: Confounding, single degree of freedom approach, hierarchical classification. Balanced and unbalanced designs. Split-plot designs. Analysis of covariance. Computer literacy: Writing and interpretation of computer programmes. Report writing.',
    credits: 24.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'DFS311',
    Name: 'Animal physiology 311',
    Description:
      'Homeostasis and Homeorehsis in animals: Thermoregulation. Adaptation of glucose, lipid and protein metabolism in response to short and long-term changes in the supply and balance of nutrients and to changes in tissue demand for nutrients during different physiological states. Deviations from normal homeostasis, metabolic diseases and the prevention thereof. Pathogenesis of inflammation and infections; immunity.',
    credits: 10.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'LEK210',
    Name: 'Introduction to agricultural economics 210',
    Description:
      'Introduction to the world of agricultural economics: where to find practising agricultural economics services, overview of South African Agricultural Economy, scope of agricultural economics. Introduction to consumption and demand: utility theory, indifference curves, the budget constraint, consumer equilibrium, the law of demand, consumer surplus, tastes and preferences, and measurement and interpretation of elasticities. Introduction to production and supply: condition for perfect competition, classification of inputs, important production relationships, assessing short-run business costs, economics of short-run decisions. Isoquants, isocost line, least cost combination of inputs, long-run expansion of inputs, and economics of business expansion, production possibility frontier, iso-revenue line and profit maximising combination of products. Introduction to market equilibrium and product prices: market equilibrium in a perfectly competitive market, total economic surplus, changes in welfare, adjustments to market equilibrium, market structure characteristics, market equilibrium in an imperfectly competitive market, government regulatory measures. Introduction to financial management in agriculture: Farm management and agricultural finance, farm management information; analysis and interpretation of farm financial statements; risk and farm planning. Budgets: partial, break-even, enterprise, total, cash flow and capital budgets. Elements of business plan, marketing planning and price risk. Financial structuring and sources of finance for farm business. Time value of money.',
    credits: 14.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'RPL310',
    Name: 'Reproduction science 310',
    Description:
      'Theriogenology, spermatogenesis, zoogenesis, the female sexual cycle. Species differences. Hormonal control of the sexual functions.',
    credits: 8.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'VGE310',
    Name: 'Nutrition science 310',
    Description:
      'Basic principles of chemistry, biochemistry of feed constituents, digestion and metabolism in all livestock species. Digestibility in monogastric and ruminant animals. Evaluation of energy and nutrient content of feedstuffs and assessment of nutritional requirements, and feeding standards for maintenance, growth, reproduction and lactation.',
    credits: 14.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'WDE310',
    Name: 'Principles of veld management 310',
    Description:
      'The influence of biotic and abiotic factors on the productivity of different strata and components of natural pastures. This will enable the student to advise users, with the necessary motivation, on the appropriate use of these strata and components and will form a basis for further research on this system. The principles of veld management and the influence of management practices on sustainable animal production from natural pastures. This will enable the student to advise users on veld management and veld management principles. It will also form a basis for further research on veld management.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 1',
    YearOfStudy: 3,
  },
  {
    Code: 'DFS320',
    Name: 'Growth physiology 320',
    Description:
      'Functional anatomy, growth and development of tissues and organ systems. The underlying physiological processes in growth and development. Pre- and postnatal growth and factors which determine growth rate: growth curves, stimulants of growth, age, nutrition, breed, sex. Changes during maturation, reproduction, the post-partum period and lactation. Ageing and tissue changes with erosion diseases. The influence of hormones, production and reproduction on conformation and a critical evaluation of assessment of animals for functional efficiency.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'RPL320',
    Name: 'Reproduction science 320',
    Description:
      'Artificial insemination. Semen collection techniques, the evaluation, dilution and conservation of semen. Collection, conservation and transfer of embryos. Collection of ova and in vitro fertilization. Handling of apparatus and practical insemination, oestrus observation and determination of gestation.',
    credits: 10.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'TLR320',
    Name: 'Animal breeding 320',
    Description:
      'Single gene, major genes and polygenes. Sources of variation, population parameters and the estimation thereof. Introduction to matrix algebra for application in animal breeding. Selection indices theory. Statistical models in estimation of breeding values. Animal recording systems and international guidelines for evaluation. Variation in traits of economic importance and statistical description. Use of genetic variation. Application of breeding values and prerequisites for accuracy. Principles of breeding systems.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'VGE320',
    Name: 'Nutrition science 320',
    Description:
      'Voluntary feed intake, description of the characteristics of commonly used feedstuffs, such as forages, silage and hay protein and energy concentrates and byproducts and feed additives.',
    credits: 14.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
  {
    Code: 'WDE320',
    Name: 'Planted pastures and fodder crops 320',
    Description:
      'The establishment and use of planted pastures species and fodder crops and the conservation of fodder. This will enable students to advise users on establishment and utilization of planted pastures species as well as farmers on the production, conservation and optimum use of fodder. This will also form a basis for further research on planted pastures.',
    credits: 12.0,
    Core: true,
    SemesterOfStudy: 'Semester 2',
    YearOfStudy: 3,
  },
]; //CORE_MODULES

export const ALL_SEED_MODULES: SeedModule[] = [...CORE_MODULES_3];
