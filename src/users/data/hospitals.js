// data/hospitals.js
export const HOSPITALS = [
  // 🟢 Guarantee Letters (Green)
  { 
    id: 1, 
    name: "Medical Center Muntinlupa (MCM)", 
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://images.squarespace-cdn.com/content/v1/607f6543f22402780bacd81a/1618961801816-H3TX55ECPKA1PE0GIHFR/MCM+%282%29.png?format=1500w",
    color: "#4CAF50",
    requirements: [
      "Clinical Abstract (In-Patients) / Medical Certificate (Outpatients)",
      "Certification of Unavailability",
      "Laboratory Results",
      "Social Case Study",
      "Valid ID",
      "Voter's ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 4, 
    name: "Ospital ng Muntinlupa", 
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://muntinlupacity.gov.ph/wp-content/uploads/2022/10/OSMUN.png",
    color: "#4CAF50",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Barangay Certificate of Indigency"
    ]
  },
  { 
    id: 19, 
    name: "Las Piñas General Hospital and Satellite Trauma Center", 
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-6/342870921_6275387025842614_9199866973637645029_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEBeFy3lEcSeqbQtTe-cZkRBV1KD5FTXBgFXUoPkVNcGAmhufmsCwvg-U_0nGFwvz5b1y1-dE8gC7H3S_ApA4EK&_nc_ohc=IOhzu3wOLNMQ7kNvwGhYyoA&_nc_oc=Adm7AAbmBbH6hmOxP7BTE5ck77ZqipRmfvyiIy-kBH3YTz6X2VQ3VWa8WqbpT4WTpjs&_nc_zt=23&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=DMtL5P6b2TJpLefNQ_j1tw&oh=00_AfGGjSQX1dXB7mQv5EhTqWYwkFIGma4ogi3mKSErXoZYGw&oe=68144ACE",
    color: "#4CAF50",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 20, 
    name: "San Lorenzo Ruiz Women's Hospital", 
    type: "guarantee",
    category: "Local Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIAJ_SwUVRtVKZtqZ7TO5yEEigqU3DG8KJfg&s",
    color: "#4CAF50",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },

  // 🔵 Medical Financial (Blue) - DOH Hospitals
  { 
    id: 2, 
    name: "Philippine Heart Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://owwamember.com/wp-content/uploads/2023/03/Philippine-Heart-Center-logo.png?x81179",
    color: "#2196F3",
    requirements: [
      "Social Case Study",
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 3, 
    name: "National Kidney and Transplant Institute (NKTI)", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://wikiwandv2-19431.kxcdn.com/_next/image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg/640px-National_Kidney_and_Transplant_Institute_%2528NKTI%2529.svg.png&w=640&q=50",
    color: "#2196F3",
    requirements: [
      "Medical Certificate (within 3 months)",
      "Quotation/Bill (All Pages)",
      "Valid ID (Muntinlupa address)",
      "Voter's ID/COMELEC Certification",
      "Certificate of Indigency",
      "Authorization Letter (if needed)"
    ]
  },
  { 
    id: 7, 
    name: "Dr. Jose N. Rodriguez Memorial Hospital and Sanitarium", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl37-2.fna.fbcdn.net/v/t39.30808-6/334944973_725976938990343_7633681305645770650_n.png?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEV3hf9MxXxWPU53Gw0PAni6s0EuwTbxQPqzQS7BNvFA2cTbq5Wmqsy16PxrQYMJwGMrqiP5QjMiO9iPaqxfnKq&_nc_ohc=FNAaTs_kJIkQ7kNvwG0YXHo&_nc_oc=AdnzBdrm_3WEkoqQxM8BY4qKEhQwY73-_zwmNRqq2jHmhnGyvaIoZR5I1d4FepUOFQU&_nc_zt=23&_nc_ht=scontent.fmnl37-2.fna&_nc_gid=5k-gNZfi41b_0iFkPqOz2Q&oh=00_AfFb_4y_PHsQC-8laHKHsQdlzfTm13Vq9hpUxYmNgxRxzg&oe=681465B3",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 8, 
    name: "Amang Rodriguez Memorial Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://armmc.doh.gov.ph/wp-content/uploads/Web_Images/cropped-cropped-armmc.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 9, 
    name: "East Avenue Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/EAMC_official.svg/1200px-EAMC_official.svg.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 10, 
    name: "Lung Center of the Philippines", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo:"https://ntp.doh.gov.ph/wp-content/uploads/2021/04/lcp_logo.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 11, 
    name: "Philippine Children's Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Philippine_Childrens_Medical_Center_%28PCMC%29.svg/1200px-Philippine_Childrens_Medical_Center_%28PCMC%29.svg.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID of Parent/Guardian",
      "Certificate of Indigency",
      "Birth Certificate of Patient"
    ]
  },
  { 
    id: 12, 
    name: "Philippine Orthopedic Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQL5VkZaoUCquOYnN5U38nkuZhqCBFYqd3WQ&s",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 13, 
    name: "San Lazaro Hospital", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl4-4.fna.fbcdn.net/v/t39.30808-6/276212395_333610525460104_7472210239027015203_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHQXthttaAdU9OzWXciv3n5HrD72CygUR4esPvYLKBRHqToh2RVYFQNUY7BN5DiCBKinnDYYjPwpDzSNvhF9Gdj&_nc_ohc=kTbNROwDBfoQ7kNvwF2L7Jx&_nc_oc=Adm6tV6D0l3M1OXK5HhsSajqBD9DPMi3wUYxuqLBguxDHbV2Vzfq3oKOhnJDiLrhTjs&_nc_zt=23&_nc_ht=scontent.fmnl4-4.fna&_nc_gid=R7iC6zLoMWiPMLY-UENPKw&oh=00_AfGj2CvVAlB5_XbocUVT5ELTzH1aBce7lQ9HVj-aTss4LA&oe=68145D1D",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 14, 
    name: "Dr. Jose Fabella Memorial Hospital", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Dr._Jose_Fabella_Memorial_Hospital_logo.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 15, 
    name: "Tondo Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl4-6.fna.fbcdn.net/v/t39.30808-6/343429285_180206298275213_3153523416755368223_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHzVKZhD3p3qbj5mMGvTsqIyFELSsAlLLXIUQtKwCUstVnQoi9aweXdGlJheeWZI9CmGhaQXM3X0RHv4ZPsWmOc&_nc_ohc=3pJxjSts32QQ7kNvwEhJ_YV&_nc_oc=AdkF2FMboSP0BJ95dwe1O8yHQ-OUyA7lacWTRhFqfHrw3pAFICosk6KPUbG30qDHlM4&_nc_zt=23&_nc_ht=scontent.fmnl4-6.fna&_nc_gid=7NUjpbNh0KAGRBe_OEsV2A&oh=00_AfG1jviE_RGt5I13DQ25dQo-A58soUfkTqXL-XfWLb0log&oe=68143942",
    color: "#2196F3",
  
  },
  { 
    id: 16, 
    name: "Quirino Memorial Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl4-3.fna.fbcdn.net/v/t39.30808-6/448608961_782035327444841_6875719695916178485_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeESFmRVolVQ5BKJ0EGr0aEIz1sDqllSWUDPWwOqWVJZQEFW-efZ_9wYf8KYl8gc6CWikzynwhnI9GQLFrtmbSnB&_nc_ohc=43zX8O_hesMQ7kNvwHHi0dt&_nc_oc=Adm5zJwfIwOdPlmKdcVfhQRqwOgiGRa9fBdYJaHFn03eRpzEceUkG6zA16EAikOE18o&_nc_zt=23&_nc_ht=scontent.fmnl4-3.fna&_nc_gid=-yjhJie5Op7fjru_ewcVVg&oh=00_AfFKIn9oUP8pgODJPytv225ZTth6KmVFum2WlgSs8bGhsw&oe=681463B7",
    color: "#2196F3",
 
  },
  { 
    id: 17, 
    name: "Valenzuela Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://peis.philjobnet.ph/employers_logo/2023/374312.jpg?current=4/19/2025%209:03:29%20PM",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 18, 
    name: "Jose R. Reyes Memorial Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://scontent.fmnl4-2.fna.fbcdn.net/v/t39.30808-6/468283806_963332559161624_3587377924204565162_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFHErJPg0HgKPoRzHDrVFtsfcO2Oe4jd7d9w7Y57iN3t--TG5b12DUevhkerryABtLAu0iW0CXRQ97FekXLEFBU&_nc_ohc=EyvzACb94XAQ7kNvwEk38TL&_nc_oc=AdmZQ5JuZK4qrCmv13QiLw2yS2ijHwejmf-tOIaIqvQwaqpgKuDcEzEtWbNjy9qYXsY&_nc_zt=23&_nc_ht=scontent.fmnl4-2.fna&_nc_gid=ivlL1jPSXC9IlrNZBQILbQ&oh=00_AfHHLvkv5Awkr28Dny0QHl6I0nTeqS2PAxDL3ap3Wzleng&oe=68143DE8",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },
  { 
    id: 21, 
    name: "Veterans Memorial Medical Center", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Veterans_Memorial_Medical_Center_%28VMMC%29.svg/640px-Veterans_Memorial_Medical_Center_%28VMMC%29.svg.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency",
      "Proof of Veteran Status"
    ]
  },
  { 
    id: 22, 
    name: "National Center for Mental Health", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS2v2cfS9E8_FiKCH2x2HuDds4A-fxZU8p9gn1vDuGpxSTP0fbGbLGYYQdPnyQxdlbSh8&usqp=CAU",
    color: "#2196F3",
    requirements: [
      "Medical Certificate/Psychiatric Evaluation",
      "Social Case Study",
      "Valid ID",
      "Certificate of Indigency",
      "Barangay Clearance"
    ]
  },
  { 
    id: 23, 
    name: "Research Institute for Tropical Medicine", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ea/Research_Institute_for_Tropical_Medicine_logo.svg/1630px-Research_Institute_for_Tropical_Medicine_logo.svg.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Laboratory Request/Results",
      "Valid ID",
      "Certificate of Indigency",
      "Referral from Local Health Center"
    ]
  },
  { 
    id: 24, 
    name: "National Children's Hospital", 
    type: "medical-financial",
    category: "DOH Hospital",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQc_aiBMJ3S194lYBFpbJdXdRtaQPkLctiZ7w&s",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Quotation/Bill",
      "Valid ID of Parent/Guardian",
      "Certificate of Indigency",
      "Birth Certificate of Patient"
    ]
  },
  { 
    id: 25, 
    name: "Philippine General Hospital", 
    type: "medical-financial",
    category: "SUC Hospital",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/UP_PGH_logo.svg/1200px-UP_PGH_logo.svg.png",
    color: "#2196F3",
    requirements: [
      "Medical Certificate",
      "Social Case Study",
      "Quotation/Bill",
      "Valid ID",
      "Certificate of Indigency"
    ]
  },

  // 🟣 Endorsement (Purple) - DSWD and Special Cases
  { 
    id: 5, 
    name: "DSWD Medical Assistance", 
    type: "dswd-medical",
    category: "National Program",
    logo: "https://vectorseek.com/wp-content/uploads/2023/08/Dswd-Logo-Vector.svg-.png",
    color: "#9C27B0",
    requirements: [
      "DSWD Prescribed Request Form",
      "Certificate of Indigency",
      "Medical Certificate/Abstract",
      "Prescription/Lab Request",
      "Unpaid Hospital Bill",
      "Social Case Study (for dialysis/cancer)"
    ]
  },
  { 
    id: 6, 
    name: "DSWD Burial Assistance", 
    type: "dswd-burial",
    category: "National Program",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdD0BMPWdRVMcM7MM_NMD4qbm1SFOlFeGb_Ik9ECluIkfCC5NKBxdLSTPZIvRv36hbYzM&usqp=CAU",
    color: "#9C27B0",

  }
];