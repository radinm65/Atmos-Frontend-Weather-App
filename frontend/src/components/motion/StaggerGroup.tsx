import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { stagger } from './variants'

/** Container whose `riseIn` children animate in one after another when it mounts. */
export function StaggerGroup(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={stagger} initial="hidden" animate="visible" {...props} />
}
