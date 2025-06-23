import React from 'react';
import { ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Location {
  id: string;
  name: string;
  deviceId: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  description: string;
}

interface LocationSelectorProps {
  selectedLocation: Location;
  onLocationChange: (location: Location) => void;
  locations: Location[];
  isLoading?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationChange,
  locations,
  isLoading = false
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/10 border-white/20 hover:bg-white/20 text-white min-w-[200px] justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="truncate">
              {isLoading ? 'Lade...' : selectedLocation.name}
            </span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[250px] bg-slate-800 border-slate-700"
      >
        {locations.map((location) => (
          <DropdownMenuItem
            key={location.id}
            onClick={() => onLocationChange(location)}
            className="text-white hover:bg-slate-700 cursor-pointer"
            disabled={isLoading}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{location.name}</span>
              <span className="text-sm text-slate-400">{location.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LocationSelector; 