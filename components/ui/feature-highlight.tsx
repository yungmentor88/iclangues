"use client";

import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureHighlightProps {
  className?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  features: React.ReactNode[];
  footer?: React.ReactNode;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

const FeatureHighlight = React.forwardRef<HTMLDivElement, FeatureHighlightProps>(
  ({ className, icon, title, features, footer }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("flex max-w-lg flex-col items-start space-y-4 text-left", className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {icon && <motion.div variants={itemVariants}>{icon}</motion.div>}
        <motion.h2
          variants={itemVariants}
          className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {title}
        </motion.h2>
        <div className="flex flex-col space-y-2">
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="text-lg text-muted-foreground sm:text-xl">
              {feature}
            </motion.div>
          ))}
        </div>
        {footer && <motion.div variants={itemVariants}>{footer}</motion.div>}
      </motion.div>
    );
  }
);

FeatureHighlight.displayName = "FeatureHighlight";
export { FeatureHighlight };
