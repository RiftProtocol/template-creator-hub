export default function HowItWorks() {
  const steps = [
    { id: "1", title: "Deposit", desc: "Send SOL and receive a secret key" },
    { id: "2", title: "Wait", desc: "Let the anonymity set grow" },
    { id: "3", title: "Withdraw", desc: "Use your secret to withdraw anonymously" },
  ];

  return (
    <div className="lg:container mx-auto px-8 pb-20 mt-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-6">
            <span className="text-[56px] font-semibold bg-gradient-to-b from-[#BABABA] to-black bg-clip-text text-transparent">
              {step.id}
            </span>
            <div>
              <h4 className="text-[#FFCC00] text-[18px] tracking-wider">
                {step.title}
              </h4>
              <p className="text-white text-[14px]">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
