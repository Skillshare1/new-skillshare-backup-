import { motion } from "framer-motion";
import { FileText, MapPin, CheckCircle, Coins } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Post a Task",
    description: "Describe what you need done, set the reward, and choose your location."
  },
  {
    icon: MapPin,
    title: "Find Workers",
    description: "Workers in your area can see and accept your task on the map."
  },
  {
    icon: CheckCircle,
    title: "Work Gets Done",
    description: "Track progress and verify completion through the platform."
  },
  {
    icon: Coins,
    title: "Automatic Payment",
    description: "Funds are automatically released from escrow when work is verified."
  }
];

export default function Steps() {
  return (
    <section id="how" className="py-20 bg-black">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple, secure, and automated from start to finish.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-600/30 transition-colors">
                    <step.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600/50 to-transparent transform translate-x-4"></div>
                  )}
                </div>
                <div className="mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full mb-3">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 