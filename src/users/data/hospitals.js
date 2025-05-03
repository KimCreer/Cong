// data/hospitals.js

// Define common requirement sets in Taglish
const COMMON_REQUIREMENTS = {
  LOCAL_HOSPITAL_INPATIENT: [
    "Clinical Abstract (for In-Patient)",
    "Certificate na Hindi Available ang Service (Certification of Unavailability)",
    "Mga Resulta ng Laboratory",
    "Social Case Study mula sa Social Worker",
    "Valid ID",
    "Voter's ID",
    "Certificate of Indigency mula sa Barangay",
    "Hospital Bill/Statement of Account"
  ],
  LOCAL_HOSPITAL_OUTPATIENT: [
    "Medical Certificate (for Out-Patient)",
    "Certificate na Hindi Available ang Service (Certification of Unavailability)",
    "Mga Resulta ng Laboratory",
    "Social Case Study mula sa Social Worker (if applicable)",
    "Valid ID",
    "Voter's ID",
    "Certificate of Indigency mula sa Barangay"
  ],
  DOH_BASIC_INPATIENT: [
    "Clinical Abstract",
    "Quotation o Bill",
    "Valid ID",
    "Certificate of Indigency mula sa Barangay",
    "Hospital Bill/Statement of Account"
  ],
  DOH_BASIC_OUTPATIENT: [
    "Medical Certificate",
    "Quotation o Bill",
    "Valid ID",
    "Certificate of Indigency mula sa Barangay"
  ],
  DOH_WITH_SOCIAL_CASE_INPATIENT: [
    "Clinical Abstract",
    "Social Case Study mula sa Social Worker",
    "Quotation o Bill",
    "Valid ID",
    "Certificate of Indigency mula sa Barangay",
    "Hospital Bill/Statement of Account"
  ],
  DOH_WITH_SOCIAL_CASE_OUTPATIENT: [
    "Medical Certificate",
    "Social Case Study mula sa Social Worker",
    "Quotation o Bill",
    "Valid ID",
    "Certificate of Indigency mula sa Barangay"
  ],
  PEDIATRIC_INPATIENT: [
    "Clinical Abstract",
    "Quotation o Bill",
    "Valid ID ng Magulang o Guardian",
    "Certificate of Indigency mula sa Barangay",
    "Birth Certificate ng Pasyente",
    "Hospital Bill/Statement of Account"
  ],
  PEDIATRIC_OUTPATIENT: [
    "Medical Certificate",
    "Quotation o Bill",
    "Valid ID ng Magulang o Guardian",
    "Certificate of Indigency mula sa Barangay",
    "Birth Certificate ng Pasyente"
  ],
  NKTI_INPATIENT: [
    "Clinical Abstract (Hindi lalagpas ng 3 buwan)",
    "Quotation o Bill (Lahat ng Pages)",
    "Valid ID (Dapat address ay Muntinlupa)",
    "Voter's ID o COMELEC Certification",
    "Certificate of Indigency mula sa Barangay",
    "Authorization Letter (kung kinakailangan)",
    "Hospital Bill/Statement of Account"
  ],
  NKTI_OUTPATIENT: [
    "Medical Certificate (Hindi lalagpas ng 3 buwan)",
    "Quotation o Bill (Lahat ng Pages)",
    "Valid ID (Dapat address ay Muntinlupa)",
    "Voter's ID o COMELEC Certification",
    "Certificate of Indigency mula sa Barangay",
    "Authorization Letter (kung kinakailangan)"
  ]
};

export const HOSPITALS = [
  // ==================== 🟢 MGA HOSPITAL NA MAY GUARANTEE LETTER ====================
  {
    id: 1,
    name: "Medical Center Muntinlupa (MCM)",
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://images.squarespace-cdn.com/content/v1/607f6543f22402780bacd81a/1618961801816-H3TX55ECPKA1PE0GIHFR/MCM+%282%29.png?format=1500w",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_OUTPATIENT
    }
  },
  {
    id: 2,
    name: "Philippine Heart Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://owwamember.com/wp-content/uploads/2023/03/Philippine-Heart-Center-logo.png?x81179",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_WITH_SOCIAL_CASE_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_WITH_SOCIAL_CASE_OUTPATIENT
    }
  },
  {
    id: 3,
    name: "National Kidney and Transplant Institute (NKTI)",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://wikiwandv2-19431.kxcdn.com/_next/image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg/640px-National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg.png&w=640&q=50",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.NKTI_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.NKTI_OUTPATIENT
    }
  },
  {
    id: 4,
    name: "Ospital ng Muntinlupa",
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://muntinlupacity.gov.ph/wp-content/uploads/2022/10/OSMUN.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_OUTPATIENT
    }
  },
  {
    id: 7,
    name: "Dr. Jose N. Rodriguez Memorial Hospital and Sanitarium",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://tse3.mm.bing.net/th?id=OIP.3My-X2lI8a2Q9rtxk1usiQHaHS&pid=Api&P=0&h=220",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 8,
    name: "Amang Rodriguez Memorial Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/38/Amang_Rodriguez_Memorial_Medical_Center_logo.jpg",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 9,
    name: "East Avenue Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/EAMC_official.svg/1200px-EAMC_official.svg.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 10,
    name: "Lung Center of the Philippines",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://lh5.googleusercontent.com/proxy/dRAab9M-hN-r0Z7HXReEhkI9h2D1M9NZMvolD_z96JEQvXZDDsKdPIzM6QjQlEQPl9eHsIhwCHkTrgYGHDUWQ1yivu91XBRb7WsDPgfOWlU",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 11,
    name: "Philippine Children's Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Philippine_Childrens_Medical_Center_%28PCMC%29.svg/1200px-Philippine_Childrens_Medical_Center_%28PCMC%29.svg.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.PEDIATRIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.PEDIATRIC_OUTPATIENT
    }
  },
  {
    id: 12,
    name: "Philippine Orthopedic Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQL5VkZaoUCquOYnN5U38nkuZhqCBFYqd3WQ&s",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 13,
    name: "San Lazaro Hospital",
    type: "guarantee",
    category: "DOH Hospital",
    logo:"https://tse4.mm.bing.net/th?id=OIP.j-8OnZXR9c8zMHH_Yff-pAAAAA&pid=Api&P=0&h=220",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 14,
    name: "Dr. Jose Fabella Memorial Hospital",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Dr._Jose_Fabella_Memorial_Hospital_logo.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 15,
    name: "Tondo Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo:"https://static1.eyellowpages.ph/uploads/yp_business/photo/37671/normal_tondo-medical-center-1682409821.jpg",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 16,
    name: "Quirino Memorial Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl33-3.fna.fbcdn.net/v/t39.30808-6/448608961_782035327444841_6875719695916178485_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeESFmRVolVQ5BKJ0EGr0aEIz1sDqllSWUDPWwOqWVJZQEFW-efZ_9wYf8KYl8gc6CWikzynwhnI9GQLFrtmbSnB&_nc_ohc=3xh2ehiNRIQQ7kNvwGsK3OL&_nc_oc=AdnaugAbqtEQW9Esev9ekpICoroI13Avky3FJOKqXw1akEw22v2bh-53ybeKSxwrl4I&_nc_zt=23&_nc_ht=scontent.fmnl33-3.fna&_nc_gid=33dGVS8S4exGxsSgCbA0Yg&oh=00_AfEzcZvbWegHXOI_yy0xk-PiOv4UrvHJYzYEcJF5ajuyIw&oe=681BDC37",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 17,
    name: "Valenzuela Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://peis.philjobnet.ph/employers_logo/2023/374312.jpg?current=4/19/2025%209:03:29%20PM",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 18,
    name: "Jose R. Reyes Memorial Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://static.wixstatic.com/media/992463_3869c183fe274c7baf771ae6cf34e17a~mv2.png/v1/fill/w_495,h_495,al_c/jrrmmc.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT
    }
  },
  {
    id: 19,
    name: "Las Piñas General Hospital and Satellite Trauma Center",
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://tse4.mm.bing.net/th?id=OIP.JNEUB6dninXheG8xylZC1wHaHa&pid=Api&P=0&h=220",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_OUTPATIENT
    }
  },
  {
    id: 20,
    name: "San Lorenzo Ruiz Women's Hospital",
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIAJ_SwUVRtVKZtqZ7TO5yEEigqU3DG8KJfg&s",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.LOCAL_HOSPITAL_OUTPATIENT
    }
  },
  {
    id: 21,
    name: "Veterans Memorial Medical Center",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Veterans_Memorial_Medical_Center_%28VMMC%29.svg/640px-Veterans_Memorial_Medical_Center_%28VMMC%29.svg.png",
    color: "#4CAF50",
    requirements: {
      inpatient: [
        ...COMMON_REQUIREMENTS.DOH_BASIC_INPATIENT,
        "Patunay ng Pagiging Veteran (Proof of Veteran Status)"
      ],
      outpatient: [
        ...COMMON_REQUIREMENTS.DOH_BASIC_OUTPATIENT,
        "Patunay ng Pagiging Veteran (Proof of Veteran Status)"
      ]
    }
  },
  {
    id: 22,
    name: "National Center for Mental Health",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS2v2cfS9E8_FiKCH2x2HuDds4A-fxZU8p9gn1vDuGpxSTP0fbGbLGYYQdPnyQxdlbSh8&usqp=CAU",
    color: "#4CAF50",
    requirements: {
      inpatient: [
        "Clinical Abstract/Psychiatric Evaluation",
        "Social Case Study mula sa Social Worker",
        "Valid ID",
        "Certificate of Indigency mula sa Barangay",
        "Barangay Clearance",
        "Hospital Bill/Statement of Account"
      ],
      outpatient: [
        "Medical Certificate/Psychiatric Evaluation",
        "Social Case Study mula sa Social Worker",
        "Valid ID",
        "Certificate of Indigency mula sa Barangay",
        "Barangay Clearance"
      ]
    }
  },
  {
    id: 23,
    name: "Research Institute for Tropical Medicine",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ea/Research_Institute_for_Tropical_Medicine_logo.svg/1630px-Research_Institute_for_Tropical_Medicine_logo.svg.png",
    color: "#4CAF50",
    requirements: {
      inpatient: [
        "Clinical Abstract",
        "Laboratory Request/Resulta",
        "Valid ID",
        "Certificate of Indigency mula sa Barangay",
        "Referral mula sa Health Center",
        "Hospital Bill/Statement of Account"
      ],
      outpatient: [
        "Medical Certificate",
        "Laboratory Request/Resulta",
        "Valid ID",
        "Certificate of Indigency mula sa Barangay",
        "Referral mula sa Health Center"
      ]
    }
  },
  {
    id: 24,
    name: "National Children's Hospital",
    type: "guarantee",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQc_aiBMJ3S194lYBFpbJdXdRtaQPkLctiZ7w&s",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.PEDIATRIC_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.PEDIATRIC_OUTPATIENT
    }
  },
  {
    id: 25,
    name: "Philippine General Hospital",
    type: "guarantee",
    category: "SUC Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/UP_PGH_logo.svg/1200px-UP_PGH_logo.svg.png",
    color: "#4CAF50",
    requirements: {
      inpatient: COMMON_REQUIREMENTS.DOH_WITH_SOCIAL_CASE_INPATIENT,
      outpatient: COMMON_REQUIREMENTS.DOH_WITH_SOCIAL_CASE_OUTPATIENT
    }
  },

  // ==================== 🟣 DSWD PROGRAMS ====================
  {
    id: 5,
    name: "DSWD Medical Assistance",
    type: "dswd-medical",
    category: "National Program",
    logo: "https://vectorseek.com/wp-content/uploads/2023/08/Dswd-Logo-Vector.svg-.png",
    color: "#9C27B0",
    requirements: [
      "DSWD Request Form",
      "Certificate of Indigency mula sa Barangay",
      "Medical Certificate/Abstract",
      "Reseta o Laboratory Request",
      "Hindi pa Bayad na Hospital Bill",
      "Social Case Study (para sa dialysis/cancer)"
    ]
  },
  {
    id: 6,
    name: "DSWD Burial Assistance",
    type: "dswd-burial",
    category: "National Program",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdD0BMPWdRVMcM7MM_NMD4qbm1SFOlFeGb_Ik9ECluIkfCC5NKBxdLSTPZIvRv36hbYzM&usqp=CAU",
    color: "#9C27B0",
    requirements: [
      "Death Certificate (Certified True Copy)",
      "Kontrata sa Punerarya (Funeral Contract)",
      "Valid ID ng Nag-aasikaso",
      "Certificate of Indigency mula sa Barangay",
      "Barangay Certification"
    ]
  }
];