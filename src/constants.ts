export type ResponseType = 'yes_no' | 'difficulty' | 'text';

export interface Question {
  id: string;
  label: string;
  type: ResponseType;
  hint?: string;
}

export interface Domain {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  questions: Question[];
}

export const ASSESSMENT_DOMAINS: Domain[] = [
  {
    id: 'general',
    num: 1,
    title: 'Informations générales',
    subtitle: 'Identité, pathologie, aides en place',
    questions: [
      { id: 'identity', label: 'Prénom / Initiales', type: 'text' },
      { id: 'age', label: 'Âge', type: 'text' },
      { id: 'situation_fam', label: 'Situation familiale', type: 'text', hint: 'seul(e), en couple, avec enfants…' },
      { id: 'pathology', label: 'Pathologie principale', type: 'text' },
      { id: 'handicap', label: 'Déficiences / handicap', type: 'text', hint: 'moteur, sensoriel, cognitif…' },
      { id: 'anciennete', label: 'Ancienneté du handicap', type: 'text', hint: 'congénital, acquis, date approximative' },
      { id: 'pain', label: 'Douleurs chroniques', type: 'text', hint: 'localisation, intensité' },
      { id: 'fatigue', label: 'Fatigue chronique', type: 'text', hint: 'impact sur les activités' },
      { id: 'human_aids', label: 'Aides humaines en place', type: 'text', hint: 'qui, fréquence, nature' },
      { id: 'aides_techniques_existantes', label: 'Aides techniques déjà utilisées', type: 'text', hint: 'lesquelles' },
    ],
  },
  {
    id: 'housing',
    num: 2,
    title: 'Logement',
    subtitle: 'Type, accessibilité, configuration',
    questions: [
      { id: 'type_logement', label: 'Type de logement', type: 'text', hint: 'maison, appartement, résidence…' },
      { id: 'etage', label: 'Étage', type: 'text', hint: 'préciser si ascenseur disponible' },
      { id: 'marches_entree', label: 'Marches à l\'entrée', type: 'yes_no', hint: 'nombre, hauteur' },
      { id: 'largeur_portes', label: 'Largeur des portes (passage fauteuil)', type: 'difficulty' },
      { id: 'acces_chambre', label: 'Accessibilité de la chambre', type: 'difficulty' },
      { id: 'acces_sdb', label: 'Accessibilité de la salle de bain', type: 'difficulty' },
      { id: 'acces_wc_log', label: 'Accessibilité des WC', type: 'difficulty' },
      { id: 'acces_cuisine', label: 'Accessibilité de la cuisine', type: 'difficulty' },
      { id: 'sol_obstacles', label: 'Sol glissant / obstacles', type: 'yes_no', hint: 'tapis, câbles, marches intérieures' },
      { id: 'eclairage', label: 'Éclairage adapté', type: 'difficulty' },
    ],
  },
  {
    id: 'indoor_mobility',
    num: 3,
    title: 'Déplacements intérieur',
    subtitle: 'Marche, fauteuil, transferts',
    questions: [
      { id: 'marche_auto', label: 'Marche autonome', type: 'difficulty' },
      { id: 'aide_marche', label: 'Utilisation d\'une aide à la marche', type: 'yes_no', hint: 'canne, déambulateur, béquilles' },
      { id: 'fauteuil', label: 'Utilisation d\'un fauteuil roulant', type: 'yes_no', hint: 'manuel, électrique' },
      { id: 'transferts_lit', label: 'Transferts lit / fauteuil', type: 'difficulty' },
      { id: 'transferts_wc', label: 'Transferts fauteuil / WC', type: 'difficulty' },
      { id: 'franchissement_seuils', label: 'Franchissement des seuils', type: 'difficulty' },
      { id: 'escaliers', label: 'Montée / descente escaliers', type: 'difficulty' },
      { id: 'risque_chute', label: 'Risque de chute', type: 'yes_no', hint: 'antécédents, fréquence' },
    ],
  },
  {
    id: 'outdoor_mobility',
    num: 4,
    title: 'Déplacements extérieur',
    subtitle: 'Transports, commerces, soins',
    questions: [
      { id: 'sorties_auto', label: 'Sorties autonomes', type: 'difficulty' },
      { id: 'transports_commun', label: 'Transports en commun', type: 'difficulty' },
      { id: 'acces_commerces', label: 'Accès aux commerces de proximité', type: 'difficulty' },
      { id: 'acces_soins', label: 'Accès aux soins (médecin, kiné…)', type: 'difficulty' },
      { id: 'vehicule_amenage', label: 'Véhicule aménagé', type: 'yes_no' },
      { id: 'acces_loisirs_ext', label: 'Accès aux loisirs / activités extérieures', type: 'difficulty' },
    ],
  },
  {
    id: 'hygiene',
    num: 5,
    title: 'Toilette / Hygiène',
    subtitle: 'Accès salle de bain, douche, soins corporels',
    questions: [
      { id: 'acces_sdb2', label: 'Accès à la salle de bain', type: 'difficulty' },
      { id: 'type_douche', label: 'Type : douche ou baignoire', type: 'text' },
      { id: 'entree_douche', label: 'Entrée dans la douche / baignoire', type: 'difficulty' },
      { id: 'transferts_bain', label: 'Transferts baignoire', type: 'difficulty' },
      { id: 'lavage_corps', label: 'Lavage du corps', type: 'difficulty' },
      { id: 'lavage_dos', label: 'Lavage du dos', type: 'difficulty' },
      { id: 'lavage_cheveux', label: 'Lavage des cheveux', type: 'difficulty' },
      { id: 'hygiene_dentaire', label: 'Hygiène dentaire', type: 'difficulty' },
      { id: 'rasage', label: 'Rasage / épilation', type: 'difficulty' },
      { id: 'robinets', label: 'Manipulation des robinets', type: 'difficulty' },
      { id: 'siege_douche', label: 'Utilisation d\'un siège de douche', type: 'yes_no' },
    ],
  },
  {
    id: 'wc',
    num: 6,
    title: 'WC',
    subtitle: 'Accès, transferts, hygiène',
    questions: [
      { id: 'acces_wc2', label: 'Accès aux WC', type: 'difficulty' },
      { id: 'transferts_wc2', label: 'Transferts sur les WC', type: 'difficulty' },
      { id: 'installation_wc', label: 'Installation / positionnement', type: 'difficulty' },
      { id: 'hygiene_wc', label: 'Hygiène post-miction / défécation', type: 'difficulty' },
      { id: 'manipulation_vets_wc', label: 'Manipulation des vêtements', type: 'difficulty' },
      { id: 'urgences_mict', label: 'Urgences mictionnelles', type: 'yes_no' },
    ],
  },
  {
    id: 'dressing',
    num: 7,
    title: 'Habillage / Déshabillage',
    subtitle: 'Autonomie, manipulation',
    questions: [
      { id: 'hab_haut', label: 'Habillage haut du corps', type: 'difficulty' },
      { id: 'hab_bas', label: 'Habillage bas du corps', type: 'difficulty' },
      { id: 'boutons', label: 'Manipulation des boutons', type: 'difficulty' },
      { id: 'fermetures', label: 'Manipulation des fermetures éclair', type: 'difficulty' },
      { id: 'chaussage', label: 'Chaussage (chaussures, chaussettes)', type: 'difficulty' },
    ],
  },
  {
    id: 'meals',
    num: 8,
    title: 'Repas',
    subtitle: 'Préparation, manipulation, prise',
    questions: [
      { id: 'prep_repas_simples', label: 'Préparation repas simples', type: 'difficulty' },
      { id: 'prep_repas_elabores', label: 'Préparation repas élaborés', type: 'difficulty' },
      { id: 'ustensiles', label: 'Utilisation des ustensiles', type: 'difficulty' },
      { id: 'emballages', label: 'Ouverture des emballages', type: 'difficulty' },
      { id: 'port_charge_cuisine', label: 'Port de charge (casserole, bouilloire…)', type: 'difficulty' },
      { id: 'prise_repas', label: 'Prise de repas (manger seul)', type: 'difficulty' },
      { id: 'acces_frigo', label: 'Accès réfrigérateur / placards', type: 'difficulty' },
      { id: 'plaques_cuisson', label: 'Utilisation des plaques de cuisson', type: 'difficulty' },
    ],
  },
  {
    id: 'housekeeping',
    num: 9,
    title: 'Entretien du logement',
    subtitle: 'Ménage, lessive, repassage',
    questions: [
      { id: 'menage', label: 'Ménage (aspiration, balayage)', type: 'difficulty' },
      { id: 'lavage_sols', label: 'Lavage des sols', type: 'difficulty' },
      { id: 'nettoyage_sdb_wc', label: 'Nettoyage salle de bain / WC', type: 'difficulty' },
      { id: 'machine_laver', label: 'Lessive (machine à laver)', type: 'difficulty' },
      { id: 'etendre_linge', label: 'Étendre / plier le linge', type: 'difficulty' },
      { id: 'repassage', label: 'Repassage', type: 'difficulty' },
      { id: 'vaisselle', label: 'Vaisselle', type: 'difficulty' },
    ],
  },
  {
    id: 'shopping',
    num: 10,
    title: 'Courses',
    subtitle: 'Accès, port de charge, organisation',
    questions: [
      { id: 'acces_magasin', label: 'Accès aux magasins', type: 'difficulty' },
      { id: 'port_sacs', label: 'Port des sacs de courses', type: 'difficulty' },
      { id: 'orga_courses', label: 'Organisation des courses', type: 'difficulty' },
      { id: 'courses_ligne', label: 'Courses en ligne / livraison', type: 'yes_no' },
      { id: 'gestion_budget', label: 'Gestion du budget', type: 'difficulty' },
    ],
  },
  {
    id: 'communication',
    num: 11,
    title: 'Communication',
    subtitle: 'Téléphone, smartphone, ordinateur',
    questions: [
      { id: 'tel_fixe', label: 'Téléphone fixe', type: 'difficulty' },
      { id: 'smartphone', label: 'Smartphone', type: 'difficulty' },
      { id: 'ordinateur', label: 'Ordinateur', type: 'difficulty' },
      { id: 'messagerie', label: 'Messagerie / email', type: 'difficulty' },
      { id: 'tv_radio', label: 'Accès à l\'information (TV, radio)', type: 'difficulty' },
      { id: 'difficultes_sensorielles', label: 'Difficultés sensorielles', type: 'yes_no', hint: 'vision, audition' },
    ],
  },
  {
    id: 'driving',
    num: 12,
    title: 'Conduite automobile',
    subtitle: 'Permis, véhicule, transferts',
    questions: [
      { id: 'permis', label: 'Titulaire du permis de conduire', type: 'yes_no' },
      { id: 'conduite_actuelle', label: 'Conduite actuelle', type: 'difficulty' },
      { id: 'amenagement_vehicule', label: 'Aménagement du véhicule', type: 'yes_no' },
      { id: 'transferts_vehicule', label: 'Transferts vers le véhicule', type: 'difficulty' },
      { id: 'chargement_fauteuil', label: 'Chargement fauteuil dans le véhicule', type: 'difficulty' },
    ],
  },
  {
    id: 'leisure',
    num: 13,
    title: 'Loisirs',
    subtitle: 'Sport, culture, activités sociales',
    questions: [
      { id: 'activites_sportives', label: 'Activités sportives', type: 'yes_no', hint: 'lesquelles, fréquence' },
      { id: 'activites_culturelles', label: 'Activités culturelles', type: 'yes_no' },
      { id: 'sorties_loisirs', label: 'Sorties extérieures', type: 'difficulty' },
      { id: 'lecture_ecriture', label: 'Lecture / écriture', type: 'difficulty' },
      { id: 'activites_creatives', label: 'Activités créatives', type: 'yes_no', hint: 'peinture, musique…' },
    ],
  },
  {
    id: 'garden_diy',
    num: 14,
    title: 'Jardinage et bricolage',
    subtitle: 'Outils, sécurité',
    questions: [
      { id: 'jardinage', label: 'Jardinage', type: 'difficulty' },
      { id: 'bricolage', label: 'Bricolage', type: 'difficulty' },
      { id: 'manipulation_outils', label: 'Manipulation des outils', type: 'difficulty' },
      { id: 'risques_securite', label: 'Risques de sécurité', type: 'yes_no', hint: 'coupures, chutes, brûlures' },
    ],
  },
  {
    id: 'social_life',
    num: 15,
    title: 'Vie sociale',
    subtitle: 'Isolement, participation, liens',
    questions: [
      { id: 'isolement', label: 'Sentiment d\'isolement', type: 'yes_no' },
      { id: 'liens_familiaux', label: 'Maintien des liens familiaux', type: 'difficulty' },
      { id: 'liens_amicaux', label: 'Maintien des liens amicaux', type: 'difficulty' },
      { id: 'activites_collectives', label: 'Participation à des activités collectives', type: 'difficulty' },
      { id: 'benevolat', label: 'Bénévolat / engagement associatif', type: 'yes_no' },
      { id: 'aide_domicile', label: 'Recours aux services d\'aide à domicile', type: 'yes_no' },
    ],
  },
  {
    id: 'intimacy_parenting',
    num: 16,
    title: 'Vie intime affective et sexuelle + parentalité',
    subtitle: 'Vie affective, sexuelle, soins aux enfants',
    questions: [
      { id: 'affective_life', label: 'Vie affective et relationnelle', type: 'text' },
      { id: 'sexual_life', label: 'Vie sexuelle (confort, aides techniques, accès)', type: 'difficulty' },
      { id: 'parenting', label: 'Parentalité (soins aux enfants, organisation)', type: 'difficulty' },
      { id: 'intimacy_needs', label: 'Besoins d\'information ou d\'orientation spécifique', type: 'yes_no' },
    ],
  },
  {
    id: 'life_project',
    num: 17,
    title: 'Projet de vie',
    subtitle: 'Souhaits, priorités, objectifs personnels',
    questions: [
      { id: 'souhaits', label: 'Souhaits de la personne', type: 'text' },
      { id: 'priorities', label: 'Priorités identifiées par la personne', type: 'text' },
      { id: 'objectifs_perso', label: 'Objectifs personnels', type: 'text' },
      { id: 'craintes', label: 'Craintes / freins exprimés', type: 'text' },
      { id: 'ressources', label: 'Ressources et motivations', type: 'text' },
    ],
  },
];
