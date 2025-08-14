import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, ExternalLink } from "lucide-react";

interface AIToolCardProps {
  title: string;
  description: string;
  category: string;
  rating: number;
  icon: React.ReactNode;
  isPremium?: boolean;
  isPopular?: boolean;
  onClick: () => void;
}

export function AIToolCard({
  title,
  description,
  category,
  rating,
  icon,
  isPremium = false,
  isPopular = false,
  onClick
}: AIToolCardProps) {
  return (
    <Card className="card-gradient border border-holo-blue/20 hover:border-holo-blue/50 transition-all duration-300 hover:shadow-glow group cursor-pointer p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-holo-blue/20 text-holo-blue group-hover:bg-holo-blue/30 transition-colors">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-holo-blue transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {category}
                </Badge>
                {isPremium && (
                  <Badge variant="outline" className="text-xs border-cyber-purple text-cyber-purple">
                    Premium
                  </Badge>
                )}
                {isPopular && (
                  <Badge className="text-xs bg-holo-blue text-background">
                    Popular
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={14} className="fill-current" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:bg-holo-blue/10"
          onClick={onClick}
        >
          <span>Try Now</span>
          <ExternalLink size={14} />
        </Button>
      </div>
    </Card>
  );
}