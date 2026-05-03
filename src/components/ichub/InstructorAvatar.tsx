import { COLOR_CLASSES, getInitials, type Instructor } from '@/services/instructors';

interface Props {
  instructor: Pick<Instructor, 'name' | 'color'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-base',
};

export default function InstructorAvatar({ instructor, size = 'md', className = '' }: Props) {
  const c = COLOR_CLASSES[instructor.color] || COLOR_CLASSES.violet;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${c.bg} text-white ${SIZES[size]} ${className}`}
      title={instructor.name}
    >
      {getInitials(instructor.name)}
    </span>
  );
}
