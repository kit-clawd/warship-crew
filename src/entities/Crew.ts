import Phaser from 'phaser';
import { CREW_CONFIG, COLORS } from '../config/constants';
import type { Station } from './Station';

export class Crew extends Phaser.GameObjects.Container {
  public health: number;
  public morale: number;
  public assignedStation: Station | null = null;
  public isSelected: boolean = false;
  public isDragging: boolean = false;
  
  private sprite: Phaser.GameObjects.Ellipse;
  private healthBar: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private targetX: number | null = null;
  private targetY: number | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.health = CREW_CONFIG.baseHealth;
    this.morale = CREW_CONFIG.baseMorale;
    
    // Create crew visual (simple oval for now)
    this.sprite = scene.add.ellipse(0, 0, CREW_CONFIG.size, CREW_CONFIG.size * 1.3, COLORS.crew);
    this.sprite.setStrokeStyle(2, 0x000000);
    this.add(this.sprite);
    
    // Health bar background
    this.healthBarBg = scene.add.rectangle(0, -CREW_CONFIG.size, 20, 4, 0x333333);
    this.add(this.healthBarBg);
    
    // Health bar
    this.healthBar = scene.add.rectangle(0, -CREW_CONFIG.size, 20, 4, 0x44ff44);
    this.add(this.healthBar);
    
    // Make interactive
    this.setSize(CREW_CONFIG.size * 2, CREW_CONFIG.size * 2);
    this.setInteractive({ draggable: true, useHandCursor: true });
    
    this.setupDragEvents();
    
    scene.add.existing(this);
  }
  
  private setupDragEvents(): void {
    this.on('dragstart', () => {
      this.isDragging = true;
      this.setSelected(true);
      this.setDepth(1000);
      // Unassign from current station
      if (this.assignedStation) {
        this.assignedStation.removeCrew(this);
        this.assignedStation = null;
      }
    });
    
    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      this.y = dragY;
    });
    
    this.on('dragend', () => {
      this.isDragging = false;
      this.setDepth(10);
      // Station assignment handled by BattleScene
      this.scene.events.emit('crewDropped', this);
    });
    
    this.on('pointerdown', () => {
      if (!this.isDragging) {
        this.setSelected(!this.isSelected);
      }
    });
  }
  
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.sprite.setFillStyle(selected ? COLORS.crewSelected : 
      (this.health < 50 ? COLORS.crewInjured : COLORS.crew));
    this.sprite.setStrokeStyle(selected ? 3 : 2, selected ? 0xffffff : 0x000000);
  }
  
  moveToPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }
  
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    
    if (this.health <= 0) {
      this.die();
    } else if (this.health < 50) {
      this.sprite.setFillStyle(COLORS.crewInjured);
    }
  }
  
  heal(amount: number): void {
    this.health = Math.min(CREW_CONFIG.baseHealth, this.health + amount);
    this.updateHealthBar();
    
    if (this.health >= 50 && !this.isSelected) {
      this.sprite.setFillStyle(COLORS.crew);
    }
  }
  
  private updateHealthBar(): void {
    const healthPercent = this.health / CREW_CONFIG.baseHealth;
    this.healthBar.setScale(healthPercent, 1);
    this.healthBar.setX(-10 * (1 - healthPercent));
    
    // Color based on health
    if (healthPercent > 0.6) {
      this.healthBar.setFillStyle(0x44ff44);
    } else if (healthPercent > 0.3) {
      this.healthBar.setFillStyle(0xffff44);
    } else {
      this.healthBar.setFillStyle(0xff4444);
    }
  }
  
  private die(): void {
    // Emit death event
    this.scene.events.emit('crewDied', this);
    
    // Remove from station
    if (this.assignedStation) {
      this.assignedStation.removeCrew(this);
    }
    
    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  update(delta: number): void {
    // Move towards target if set
    if (this.targetX !== null && this.targetY !== null && !this.isDragging) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const speed = CREW_CONFIG.moveSpeed * (delta / 1000);
        const ratio = speed / distance;
        this.x += dx * Math.min(ratio, 1);
        this.y += dy * Math.min(ratio, 1);
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = null;
        this.targetY = null;
      }
    }
  }
  
  isInjured(): boolean {
    return this.health < CREW_CONFIG.baseHealth * 0.7;
  }
  
  isCritical(): boolean {
    return this.health < CREW_CONFIG.baseHealth * 0.3;
  }
}
