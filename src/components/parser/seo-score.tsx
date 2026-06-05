import { formatScore, getScoreColorClass } from '~/schemas/seo';

interface SeoScoreProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBadge?: boolean;
}

export function SeoScore({
  score,
  label,
  size = 'md',
  showLabel = true,
  showBadge = true,
}: SeoScoreProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-seo-excellent' };
    if (score >= 70) return { text: 'Good', color: 'bg-seo-good' };
    if (score >= 50) return { text: 'Fair', color: 'bg-seo-fair' };
    return { text: 'Poor', color: 'bg-seo-poor' };
  };

  const level = getScoreLevel(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background circle */}
        <svg
          className="w-full h-full"
          viewBox="0 0 36 36"
          role="img"
          aria-label={`SEO Score: ${score}`}
        >
          <title>SEO Score: {score}</title>
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-secondary"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            className={`${getScoreColorClass(score)} transform -rotate-90 origin-center`}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${getScoreColorClass(score)}`}>{score}</span>
        </div>
      </div>

      {showLabel && (
        <span className={`text-muted-foreground font-medium ${labelSizeClasses[size]}`}>
          {label}
        </span>
      )}

      {showBadge && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${level.color}`}>
          {level.text}
        </span>
      )}
    </div>
  );
}

interface SeoScoreGridProps {
  scores: {
    technicalSeo: number;
    contentSeo: number;
    metaTags: number;
    linkStructure: number;
  };
}

export function SeoScoreGrid({ scores }: SeoScoreGridProps) {
  const overallScore = Math.round(
    (scores.technicalSeo + scores.contentSeo + scores.metaTags + scores.linkStructure) / 4
  );

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="flex justify-center">
        <SeoScore score={overallScore} label="Overall SEO Score" size="lg" showBadge={true} />
      </div>

      {/* Individual scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SeoScore score={scores.technicalSeo} label="Technical SEO" size="sm" showBadge={false} />
        <SeoScore score={scores.contentSeo} label="Content SEO" size="sm" showBadge={false} />
        <SeoScore score={scores.metaTags} label="Meta Tags" size="sm" showBadge={false} />
        <SeoScore score={scores.linkStructure} label="Link Structure" size="sm" showBadge={false} />
      </div>
    </div>
  );
}

interface SeoScoreBarProps {
  score: number;
  label: string;
  maxScore?: number;
}

export function SeoScoreBar({ score, label, maxScore = 100 }: SeoScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-seo-excellent';
    if (score >= 70) return 'bg-seo-good';
    if (score >= 50) return 'bg-seo-fair';
    return 'bg-seo-poor';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-bold ${getScoreColorClass(score)}`}>
          {formatScore(score)}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
