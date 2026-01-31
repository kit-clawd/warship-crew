import Phaser from 'phaser';
import type { Crew } from './Crew';
import { STATION_TYPES } from '../config/constants';

type StationType = keyof typeof STATION_TYPES;

export class Station extends Phaser.GameObjects.Container {
  public stationType: StationType;
  public assignedCrew: Crew[] = [];
  public isActive: boolean = false;
  public lastActionTime: number = 0;
  
  private config: typeof STATION_TYPES[StationType];
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private crewCounter: Phaser.GameObjects.Text;
  private dropZone: Phaser.GameObjects.Zone;
  private glowEffect: Phaser.GameObjects.Rectangle;
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    type: StationType
  ) {
    super(scene, x, y);
    
    this.stationType = type;
    this.config = STATION_TYPES[type];
    
    // Glow effect (for when hovering with crew)
    this.glowEffect = scene.add.rectangle(0, 0, width + 10, height + 10, this.config.color, 0.3);
    this.glowEffect.setVisible(false);
    this.add(this.glowEffect);
    
    // Background
    this.background = scene.add.rectangle(0, 0, width, height, this.config.color, 0.4);
    this.add(this.background);
    
    // Border
    this.border = scene.add.rectangle(0, 0, width, height);
    this.border.setStrokeStyle(2, this.config.color);
    this.border.setFillStyle(0x000000, 0);
    this.add(this.border);
    
    // Station name label
    this.label = scene.add.text(0, -height/2 + 12, this.config.name, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5, 0.5);
    this.add(this.label);
    
    // Crew counter
    this.crewCounter = scene.add.text(0, height/2 - 12, '0/' + this.config.crewMax, {
      fontSize: '14px',
      color: '#ffffff',
    });
    this.crewCounter.setOrigin(0.5, 0.5);
    this.add(this.crewCounter);
    
    // Drop zone for crew
    this.dropZone = scene.add.zone(0, 0, width, height);
    this.dropZone.setRectangleDropZone(width, height);
    this.add(this.dropZone);
    
    // Visual feedback on hover
    this.dropZone.on('pointerover', () => {
      this.glowEffect.setVisible(true);
    });
    
    this.dropZone.on('pointerout', () => {
      this.glowEffect.setVisible(false);
    });
    
    scene.add.existing(this);
  }
  
  getDropZone(): Phaser.GameObjects.Zone {
    return this.dropZone;
  }
  
  canAcceptCrew(): boolean {
    return this.assignedCrew.length < this.config.crewMax;
  }
  
  addCrew(crew: Crew): boolean {
    if (!this.canAcceptCrew()) return false;
    
    this.assignedCrew.push(crew);
    crew.assignedStation = this;
    
    // Position crew within station
    this.positionCrew();
    this.updateDisplay();
    
    return true;
  }
  
  removeCrew(crew: Crew): void {
    const index = this.assignedCrew.indexOf(crew);
    if (index > -1) {
      this.assignedCrew.splice(index, 1);
      crew.assignedStation = null;
      this.updateDisplay();
    }
  }
  
  private positionCrew(): void {
    const width = this.background.width - 20;
    const spacing = Math.min(30, width / Math.max(1, this.assignedCrew.length));
    const startX = this.x - (this.assignedCrew.length - 1) * spacing / 2;
    
    this.assignedCrew.forEach((crew, i) => {
      crew.moveToPosition(startX + i * spacing, this.y);
    });
  }
  
  private updateDisplay(): void {
    const count = this.assignedCrew.length;
    const required = this.config.crewRequired;
    const max = this.config.crewMax;
    
    this.crewCounter.setText(`${count}/${max}`);
    
    // Update active state
    this.isActive = count >= required;
    
    // Visual feedback
    if (count === 0) {
      this.border.setStrokeStyle(2, 0x666666);
      this.background.setAlpha(0.2);
    } else if (count < required) {
      this.border.setStrokeStyle(2, 0xffaa00);
      this.background.setAlpha(0.4);
    } else {
      this.border.setStrokeStyle(3, 0x44ff44);
      this.background.setAlpha(0.6);
    }
  }
  
  // Check if a point is within this station's bounds
  containsPoint(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return bounds.contains(x, y);
  }
  
  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.background.width / 2,
      this.y - this.background.height / 2,
      this.background.width,
      this.background.height
    );
  }
  
  // Get effectiveness based on crew count
  getEffectiveness(): number {
    const count = this.assignedCrew.length;
    const required = this.config.crewRequired;
    const max = this.config.crewMax;
    
    if (count < required) return 0;
    
    // Linear scaling from required to max
    const baseEffectiveness = 0.5;
    const bonusPerCrew = 0.5 / (max - required);
    return baseEffectiveness + (count - required) * bonusPerCrew;
  }
  
  getConfig(): typeof STATION_TYPES[StationType] {
    return this.config;
  }
  
  showHighlight(show: boolean): void {
    this.glowEffect.setVisible(show);
  }
}
