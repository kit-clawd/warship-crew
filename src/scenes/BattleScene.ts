import Phaser from 'phaser';
import { Crew } from '../entities/Crew';
import { Station } from '../entities/Station';
import { Crisis } from '../entities/Crisis';
import { 
  SHIP_CONFIG, 
  CREW_CONFIG, 
  COLORS, 
  ENEMY_CONFIG,
  CRISIS_TYPES 
} from '../config/constants';

export class BattleScene extends Phaser.Scene {
  private crew: Crew[] = [];
  private stations: Station[] = [];
  private crises: Crisis[] = [];
  
  private shipHealth: number = 500;
  private enemyHealth: number = ENEMY_CONFIG.baseHealth;
  private powder: number = 100;
  private maxPowder: number = 100;
  
  private shipGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private enemyHealthBar!: Phaser.GameObjects.Rectangle;
  private powderBar!: Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;
  
  private lastEnemyFireTime: number = 0;
  private battleStarted: boolean = false;
  private gameOver: boolean = false;
  
  private helpOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'BattleScene' });
  }
  
  preload(): void {
    // No external assets needed - using clean vector graphics
  }
  
  create(): void {
    // Draw ship
    this.drawShip();
    
    // Create stations
    this.createStations();
    
    // Spawn crew
    this.spawnCrew(CREW_CONFIG.startingCrew);
    
    // Create UI
    this.createUI();
    
    // Create help overlay
    this.createHelpOverlay();
    
    // Set up event listeners
    this.setupEvents();
    
    // Start battle after brief delay
    this.time.delayedCall(1000, () => {
      this.battleStarted = true;
      this.showMessage('Battle stations! Enemy approaching!');
    });
  }
  
  private drawShip(): void {
    this.shipGraphics = this.add.graphics();
    const g = this.shipGraphics;
    
    const shipX = 90;
    const shipY = 60;
    const { width, height, deckHeight, decks } = SHIP_CONFIG;
    
    // Water background
    g.fillStyle(COLORS.water, 1);
    g.fillRect(0, shipY + height - 40, 1280, 200);
    
    // Sky gradient
    g.fillStyle(COLORS.sky, 1);
    g.fillRect(0, 0, 1280, shipY + height - 40);
    
    // Ship hull outline
    g.lineStyle(4, COLORS.hullDark);
    g.fillStyle(COLORS.hull, 1);
    
    // Draw hull shape (curved bottom)
    g.beginPath();
    g.moveTo(shipX, shipY); // Top left
    g.lineTo(shipX + width, shipY); // Top right
    g.lineTo(shipX + width + 20, shipY + height - 50); // Bottom right curve
    g.lineTo(shipX + width - 50, shipY + height); // Bottom right
    g.lineTo(shipX + 50, shipY + height); // Bottom left
    g.lineTo(shipX - 20, shipY + height - 50); // Bottom left curve
    g.closePath();
    g.fillPath();
    g.strokePath();
    
    // Draw deck lines
    g.lineStyle(2, COLORS.hullDark);
    for (let i = 1; i < decks; i++) {
      const y = shipY + i * deckHeight;
      g.beginPath();
      g.moveTo(shipX + 10, y);
      g.lineTo(shipX + width - 10, y);
      g.strokePath();
    }
    
    // Draw deck lines
    g.lineStyle(2, COLORS.hullDark);
    for (let i = 1; i < decks; i++) {
      const y = shipY + i * deckHeight;
      g.beginPath();
      g.moveTo(shipX + 10, y);
      g.lineTo(shipX + width - 10, y);
      g.strokePath();
    }
    
    // Draw deck floors
    g.fillStyle(COLORS.deck, 1);
    for (let i = 0; i < decks - 1; i++) {
      const y = shipY + i * deckHeight + deckHeight - 10;
      g.fillRect(shipX + 20, y, width - 40, 8);
    }
    
    // Draw gun ports (squares on the hull)
    g.fillStyle(0x222222, 1);
    for (let deck = 1; deck <= 3; deck++) {
      const y = shipY + deck * deckHeight + 40;
      const numPorts = 8 - deck;
      const spacing = (width - 100) / numPorts;
      for (let i = 0; i < numPorts; i++) {
        const x = shipX + 60 + i * spacing;
        g.fillRect(x, y, 20, 15);
      }
    }

    // Ship name
    this.add.text(shipX + width / 2, shipY - 20, 'HMS INDOMITABLE', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }
  
  private createStations(): void {
    const shipX = 90;
    const shipY = 60;
    const { width, deckHeight } = SHIP_CONFIG;
    
    // Upper gun deck - 3 cannon stations
    for (let i = 0; i < 3; i++) {
      const x = shipX + 150 + i * 280;
      const y = shipY + deckHeight + 60;
      const station = new Station(this, x, y, 100, 80, 'CANNON_UPPER');
      this.stations.push(station);
    }
    
    // Middle gun deck - 3 cannon stations
    for (let i = 0; i < 3; i++) {
      const x = shipX + 150 + i * 280;
      const y = shipY + 2 * deckHeight + 60;
      const station = new Station(this, x, y, 100, 80, 'CANNON_MIDDLE');
      this.stations.push(station);
    }
    
    // Lower gun deck - 2 big cannon stations
    for (let i = 0; i < 2; i++) {
      const x = shipX + 250 + i * 400;
      const y = shipY + 3 * deckHeight + 60;
      const station = new Station(this, x, y, 120, 80, 'CANNON_LOWER');
      this.stations.push(station);
    }
    
    // Hold - powder room, surgery, pumps
    const holdY = shipY + 4 * deckHeight + 50;
    
    const powderRoom = new Station(this, shipX + 200, holdY, 100, 70, 'POWDER_ROOM');
    this.stations.push(powderRoom);
    
    const surgery = new Station(this, shipX + width / 2, holdY, 100, 70, 'SURGERY');
    this.stations.push(surgery);
    
    const pumps = new Station(this, shipX + width - 200, holdY, 100, 70, 'PUMPS');
    this.stations.push(pumps);
    
    // Weather deck - marines
    const marines = new Station(this, shipX + width / 2, shipY + 50, 150, 60, 'MARINES');
    this.stations.push(marines);
  }
  
  private spawnCrew(count: number): void {
    const shipX = 90;
    const shipY = 60;
    const { width } = SHIP_CONFIG;
    
    for (let i = 0; i < count; i++) {
      // Spawn in random positions within the ship
      const x = shipX + 100 + Math.random() * (width - 200);
      const y = shipY + 100 + Math.random() * 400;
      
      const crew = new Crew(this, x, y);
      this.crew.push(crew);
    }
  }
  
  private createHelpOverlay(): void {
    const overlay = this.add.container(640, 360);
    overlay.setDepth(400);
    
    // Semi-transparent background
    const bg = this.add.rectangle(0, 0, 700, 400, 0x000000, 0.9);
    bg.setStrokeStyle(3, COLORS.crew);
    
    // Title
    const title = this.add.text(0, -150, 'HOW TO PLAY', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Instructions
    const instructions = [
      { icon: '📋', text: 'Click a crew member to select them' },
      { icon: '🚚', text: 'Drag crew to stations to assign them' },
      { icon: '💪', text: 'Cannons need crew to fire (0/4, 0/5, etc.)' },
      { icon: '🔫', text: 'Keep powder flowing from Powder Room' },
      { icon: '🏥', text: 'Crew in Surgery heal injured crew' },
      { icon: '🚒', text: 'Fight fires and flooding crises' },
      { icon: '☠️', text: "Don't let the ship sink!" },
      { icon: '⚔️', text: 'Sink the enemy before they sink you!' }
    ];
    
    instructions.forEach((inst, i) => {
      const row = this.add.container(0, -100 + i * 45);
      
      const icon = this.add.text(-280, 0, inst.icon, {
        fontSize: '24px'
      });
      const text = this.add.text(-240, 0, inst.text, {
        fontSize: '16px',
        color: '#ffffff'
      });
      row.add([icon, text]);
      overlay.add(row);
    });
    
    // Close instruction
    const closeText = this.add.text(0, 120, '[ PRESS H to hide ]', {
      fontSize: '14px',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    overlay.add(bg);
    overlay.add(title);
    overlay.add(closeText);
    
    // Store reference
    this.helpOverlay = overlay;
    
    // Add press H event
    this.input.keyboard?.on('keydown-H', () => {
      this.toggleHelp();
    });
  }
  
  private toggleHelp(): void {
    if (this.helpOverlay) {
      const isVisible = this.helpOverlay.visible;
      this.helpOverlay.setVisible(!isVisible);
    }
  }
  
  private createUI(): void {
    this.uiContainer = this.add.container(0, 0);
    
    // Panel background
    const panel = this.add.rectangle(1200, 100, 140, 180, 0x000000, 0.7);
    panel.setStrokeStyle(2, 0xffffff);
    this.uiContainer.add(panel);
    
    // Ship health
    this.add.text(1135, 30, 'OUR SHIP', { fontSize: '12px', color: '#88ff88' });
    const healthBg = this.add.rectangle(1200, 50, 120, 16, 0x333333);
    this.uiContainer.add(healthBg);
    this.healthBar = this.add.rectangle(1200, 50, 120, 14, 0x44ff44);
    this.uiContainer.add(this.healthBar);
    
    // Enemy health
    this.add.text(1135, 70, 'ENEMY', { fontSize: '12px', color: '#ff8888' });
    const enemyHealthBg = this.add.rectangle(1200, 90, 120, 16, 0x333333);
    this.uiContainer.add(enemyHealthBg);
    this.enemyHealthBar = this.add.rectangle(1200, 90, 120, 14, 0xff4444);
    this.uiContainer.add(this.enemyHealthBar);
    
    // Powder
    this.add.text(1135, 110, 'POWDER', { fontSize: '12px', color: '#ffaa00' });
    const powderBg = this.add.rectangle(1200, 130, 120, 16, 0x333333);
    this.uiContainer.add(powderBg);
    this.powderBar = this.add.rectangle(1200, 130, 120, 14, 0xffaa00);
    this.uiContainer.add(this.powderBar);
    
    // Crew count
    this.statusText = this.add.text(1140, 155, `Crew: ${this.crew.length}`, {
      fontSize: '14px',
      color: '#ffffff',
    });
    this.uiContainer.add(this.statusText);
    
    this.uiContainer.setDepth(100);
  }
  
  private setupEvents(): void {
    // Handle crew dropped
    this.events.on('crewDropped', (crew: Crew) => {
      // Check if dropped on a station
      for (const station of this.stations) {
        if (station.containsPoint(crew.x, crew.y)) {
          if (station.addCrew(crew)) {
            return;
          }
        }
      }
      
      // Check if dropped on a crisis
      for (const crisis of this.crises) {
        const dx = crew.x - crisis.x;
        const dy = crew.y - crisis.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
          crisis.addCrew(crew);
          crew.moveToPosition(crisis.x, crisis.y);
          return;
        }
      }
    });
    
    // Handle crew death
    this.events.on('crewDied', (crew: Crew) => {
      const index = this.crew.indexOf(crew);
      if (index > -1) {
        this.crew.splice(index, 1);
      }
      this.updateUI();
    });
    
    // Handle crisis resolved
    this.events.on('crisisResolved', (crisis: Crisis) => {
      const index = this.crises.indexOf(crisis);
      if (index > -1) {
        this.crises.splice(index, 1);
      }
    });
  }
  
  update(time: number, delta: number): void {
    if (this.gameOver) return;
    
    // Update all crew
    this.crew.forEach(crew => crew.update(delta));
    
    // Update all crises
    this.crises.forEach(crisis => crisis.update(delta));
    
    if (!this.battleStarted) return;
    
    // Process stations
    this.processStations(time, delta);
    
    // Enemy fires
    this.processEnemyFire(time);
    
    // Check win/lose conditions
    this.checkGameState();
    
    // Update UI
    this.updateUI();
  }
  
  private processStations(time: number, _delta: number): void {
    for (const station of this.stations) {
      if (!station.isActive) continue;
      
      const config = station.getConfig();
      const effectiveness = station.getEffectiveness();
      
      // Cannons fire at enemy
      if ('fireRate' in config && 'damage' in config) {
        if (time - station.lastActionTime > config.fireRate / effectiveness) {
          if (this.powder >= 5) {
            this.powder -= 5;
            this.enemyHealth -= config.damage * effectiveness;
            station.lastActionTime = time;
            this.showCannonFire(station);
          }
        }
      }
      
      // Powder room generates powder
      if ('supplyRate' in config) {
        if (time - station.lastActionTime > config.supplyRate / effectiveness) {
          this.powder = Math.min(this.maxPowder, this.powder + 5);
          station.lastActionTime = time;
        }
      }
      
      // Surgery heals injured crew
      if ('healRate' in config && 'healAmount' in config) {
        if (time - station.lastActionTime > config.healRate) {
          // Find injured crew in surgery
          const injuredInSurgery = station.assignedCrew.filter(c => c.isInjured());
          if (injuredInSurgery.length > 0) {
            injuredInSurgery[0].heal(config.healAmount * effectiveness);
            station.lastActionTime = time;
          }
        }
      }
    }
  }
  
  private processEnemyFire(time: number): void {
    if (time - this.lastEnemyFireTime < ENEMY_CONFIG.fireRate) return;
    
    this.lastEnemyFireTime = time;
    
    // Enemy hits our ship
    this.shipHealth -= ENEMY_CONFIG.damage;
    this.showEnemyHit();
    
    // Chance to cause a crisis
    if (Math.random() < ENEMY_CONFIG.crisisChance) {
      this.spawnCrisis();
    }
  }
  
  private spawnCrisis(): void {
    const shipX = 90;
    const shipY = 60;
    const { width, deckHeight } = SHIP_CONFIG;
    
    // Random position within ship
    const x = shipX + 100 + Math.random() * (width - 200);
    const deck = Math.floor(Math.random() * 4) + 1;
    const y = shipY + deck * deckHeight + 50;
    
    // Random crisis type
    const types: Array<'FIRE' | 'FLOODING'> = ['FIRE', 'FLOODING'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const crisis = new Crisis(this, x, y, type);
    this.crises.push(crisis);
    
    this.showMessage(`${CRISIS_TYPES[type].name}! Assign crew to fight it!`);
  }
  
  private showCannonFire(station: Station): void {
    // Simple muzzle flash effect
    const flash = this.add.circle(station.x + 60, station.y, 15, 0xffff00, 1);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => flash.destroy()
    });
  }
  
  private showEnemyHit(): void {
    // Screen shake
    this.cameras.main.shake(100, 0.01);
    
    // Flash effect
    this.cameras.main.flash(100, 255, 100, 0);
  }
  
  private showMessage(text: string): void {
    const msg = this.add.text(640, 360, text, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    });
    msg.setOrigin(0.5);
    msg.setDepth(200);
    
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 300,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => msg.destroy()
    });
  }
  
  private updateUI(): void {
    // Health bars
    const healthPercent = Math.max(0, this.shipHealth / 500);
    this.healthBar.setScale(healthPercent, 1);
    
    const enemyPercent = Math.max(0, this.enemyHealth / ENEMY_CONFIG.baseHealth);
    this.enemyHealthBar.setScale(enemyPercent, 1);
    
    const powderPercent = this.powder / this.maxPowder;
    this.powderBar.setScale(powderPercent, 1);
    
    // Crew count
    this.statusText.setText(`Crew: ${this.crew.length}`);
  }
  
  private checkGameState(): void {
    if (this.enemyHealth <= 0) {
      this.gameOver = true;
      this.showVictory();
    } else if (this.shipHealth <= 0 || this.crew.length === 0) {
      this.gameOver = true;
      this.showDefeat();
    }
  }
  
  private showVictory(): void {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    overlay.setDepth(300);
    
    const text = this.add.text(640, 320, 'VICTORY!', {
      fontSize: '64px',
      color: '#44ff44',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(301);
    
    const subtext = this.add.text(640, 400, 'The enemy ship has struck her colors!', {
      fontSize: '24px',
      color: '#ffffff',
    });
    subtext.setOrigin(0.5);
    subtext.setDepth(301);
    
    this.addRestartButton();
  }
  
  private showDefeat(): void {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    overlay.setDepth(300);
    
    const text = this.add.text(640, 320, 'DEFEAT', {
      fontSize: '64px',
      color: '#ff4444',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(301);
    
    const subtext = this.add.text(640, 400, 
      this.crew.length === 0 ? 'All hands lost...' : 'The ship is lost!', {
      fontSize: '24px',
      color: '#ffffff',
    });
    subtext.setOrigin(0.5);
    subtext.setDepth(301);
    
    this.addRestartButton();
  }
  
  private addRestartButton(): void {
    const button = this.add.rectangle(640, 480, 200, 50, 0x444444);
    button.setStrokeStyle(2, 0xffffff);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(301);
    
    const buttonText = this.add.text(640, 480, 'Play Again', {
      fontSize: '20px',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);
    buttonText.setDepth(302);
    
    button.on('pointerover', () => button.setFillStyle(0x666666));
    button.on('pointerout', () => button.setFillStyle(0x444444));
    button.on('pointerdown', () => this.scene.restart());
  }
}
