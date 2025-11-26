import { RegisterForm } from "../components/register-form";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";

export default function RegisterPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-md mx-auto"
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={fadeIn.transition}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700 mb-2">
              Create Your Account
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              Join our community of learners and compete in the virtual market.
            </p>
          </div>
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <RegisterForm />
          </motion.div>
          <motion.div
            className="mt-6 text-center text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Already have an account? <a href="/login" className="text-sky-700 font-semibold hover:underline">Login here</a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
