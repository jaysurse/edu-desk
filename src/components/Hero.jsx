import { motion } from "framer-motion";
import heroImage from "../assets/heroImage.png";

const HeroSection = ({ onLoginClick }) => {
  const handleScroll = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto flex px-6 md:px-12 py-20 md:flex-row flex-col items-center">
        {/* Left Text Block */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:flex-grow md:w-1/2 lg:pr-16 flex flex-col md:items-start text-left mb-16 md:mb-0 items-center text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          >
            Welcome to Edu-Desk
            <br />
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{
                delay: 0.5,
                duration: 1,
                type: "spring",
                stiffness: 200,
              }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            >
              Share & Find Notes Easily
            </motion.span>
          </motion.h1>

          <p className="mb-8 text-blue-200 text-lg max-w-xl">
            A modern platform for academic collaboration and note sharing with
            your peers.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-200 transition-all"
            onClick={onLoginClick}
          >
            Get Started
          </motion.button>
        </motion.div>

        {/* Right Image Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="md:w-1/2 w-full"
        >
          <img
            src={heroImage}
            alt="Hero Illustration"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
