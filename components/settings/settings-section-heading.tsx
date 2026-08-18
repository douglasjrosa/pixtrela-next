export interface SettingsSectionHeadingProps {
  title: string;
}

export function SettingsSectionHeading({ title }: SettingsSectionHeadingProps) {
  return (
    <h2 className="font-display text-xl font-bold max-[500px]:text-lg">
      {title}
    </h2>
  );
}
