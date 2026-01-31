import Phaser from 'phaser';
import { CRISIS_TYPES } from '../config/constants';
import type { Crew } from './Crew';

type CrisisType = keyof typeof CRISIS_TYPES;

export class Crisis extends Phaser.GameObjects.Container {
  public crisisType: CrisisType;
  public intensity: number = 100; // 0-100, crisis resolved when 0
  public assignedCrew: Crew[] = [];
  
  private config: typeof CRISIS_TYPES[CrisisType];
  private visual: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  
  constructor(scene: Phaser.Scene, x: number, y: number, type: CrisisType) {
    super(scene, x, y);
    
    this.crisisType = type;
    this.config = CRISIS_TYPES[type];
    
    // Create visual based on type
    if (type === 'FIRE') {
      this.visual = scene.add.circle(0, 0, 25, this.config.color, 0.8);
      this.createFireEffect();
    } else if (type === 'FLOODING') {
      this.visual = scene.add.rectangle(0, 0, 60, 30, this.config.color, 0.6);
      this.createFloodingEffect();
    } else {
      this.visual = scene.add.circle(0, 0, 20, this.config.color, 0.9);
    }
    
    this.add(this.visual);
    
    // Make interactive for assigning crew
    this.setSize(60, 60);
    this.setInteractive();
    
    scene.add.existing(this);
    this.setDepth(50);
  }
  
  private createFireEffect(): void {
    // Pulsing glow effect
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }
  
  private createFloodingEffect(): void {
    // Sloshing effect
    this.scene.tweens.add({
      targets: this.visual,
      scaleY: 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  addCrew(crew: Crew): void {
    if (!this.assignedCrew.includes(crew)) {
      this.assignedCrew.push(crew);
    }
  }
  
  removeCrew(crew: Crew): void {
    const index = this.assignedCrew.indexOf(crew);
    if (index > -1) {
      this.assignedCrew.splice(index, 1);
    }
  }
  
  update(delta: number): void {
    // Crisis grows if not enough crew fighting it
    const crewNeeded = this.getCrewNeeded();
    const crewFighting = this.assignedCrew.length;
    
    if (crewFighting >= crewNeeded) {
      // Crew is handling it - reduce intensity
      const reduction = (crewFighting / crewNeeded) * (delta / 50);
      this.intensity = Math.max(0, this.intensity - reduction);
    } else if (crewFighting > 0) {
      // Partial crew - slow spread
      const growth = 0.5 * (delta / 100);
      this.intensity = Math.min(150, this.intensity + growth);
    } else {
      // No crew - crisis grows
      const growth = delta / 100;
      this.intensity = Math.min(150, this.intensity + growth);
    }
    
    // Update visual size based on intensity
    const scale = 0.5 + (this.intensity / 100) * 0.8;
    this.visual.setScale(scale);
    
    // Check if resolved
    if (this.intensity <= 0) {
      this.resolve();
    }
  }
  
  private getCrewNeeded(): number {
    if (this.crisisType === 'FIRE') {
      return (CRISIS_TYPES.FIRE as { crewToDouse: number }).crewToDouse;
    } else if (this.crisisType === 'FLOODING') {
      return (CRISIS_TYPES.FLOODING as { crewToPump: number }).crewToPump;
    }
    return 2;
  }
  
  private resolve(): void {
    // Free assigned crew
    this.assignedCrew.forEach(crew => {
      crew.assignedStation = null;
    });
    this.assignedCrew = [];
    
    // Emit resolved event
    this.scene.events.emit('crisisResolved', this);
    
    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  // Damage nearby crew while crisis is active
  getDamagePerSecond(): number {
    if (this.crisisType === 'FIRE') {
      return 5 * (this.intensity / 100);
    } else if (this.crisisType === 'FLOODING') {
      return 2 * (this.intensity / 100);
    }
    return 0;
  }
  
  // Check if crisis should spread
  shouldSpread(): boolean {
    return this.intensity > 100;
  }
  
  getSpreadRadius(): number {
    return 100 + (this.intensity - 100) * 2;
  }
}
