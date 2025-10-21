import Image from "next/image";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium -mb-4 md:-mb-6">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          Live on Ethereum, Polygon & Avalanche
        </div>

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Optimize your Aave positions like a pro
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          Advanced DeFi dashboard for monitoring, analyzing, and optimizing your Aave lending and borrowing positions across multiple chains.
        </p>
        <button className="btn btn-primary btn-wide">
          Launch Dashboard
        </button>
      </div>
      <div className="lg:w-full">
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
          alt="DeFi Dashboard Preview"
          className="w-full"
          priority={true}
          width={500}
          height={500}
        />
      </div>
    </section>
  );
};

export default Hero;
