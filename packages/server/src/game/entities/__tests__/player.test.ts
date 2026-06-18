import { describe, it, expect } from 'vitest';
import { Player } from '../Player.js';

describe('Player', () => {
  it('should create a player with default values', () => {
    const player = new Player('TestPlayer', 'dark_knight');

    expect(player.name).toBe('TestPlayer');
    expect(player.classType).toBe('dark_knight');
    expect(player.level).toBe(1);
    expect(player.hp).toBe(50);
    expect(player.maxHp).toBe(50);
    expect(player.online).toBe(true);
    expect(player.mapId).toBe('lorencia');
  });

  it('should take damage and reduce HP', () => {
    const player = new Player('Test', 'dark_knight');
    player.takeDamage(20);
    expect(player.hp).toBe(30);
  });

  it('should not go below 0 HP', () => {
    const player = new Player('Test', 'dark_knight');
    player.takeDamage(200);
    expect(player.hp).toBe(0);
  });

  it('should heal', () => {
    const player = new Player('Test', 'dark_knight');
    player.takeDamage(30);
    player.heal(20);
    expect(player.hp).toBe(40);
  });

  it('should not heal above max HP', () => {
    const player = new Player('Test', 'dark_knight');
    player.heal(100);
    expect(player.hp).toBe(player.maxHp);
  });

  it('should check if alive', () => {
    const player = new Player('Test', 'dark_knight');
    expect(player.isAlive()).toBe(true);
    player.takeDamage(999);
    expect(player.isAlive()).toBe(false);
  });

  it('should level up when gaining enough XP', () => {
    const player = new Player('Test', 'dark_knight');
    const leveledUp = player.addExperience(1000);
    expect(leveledUp).toBe(true);
    expect(player.level).toBeGreaterThanOrEqual(2);
  });

  it('should have increasing XP requirements', () => {
    const player = new Player('Test', 'dark_knight');
    const xp1 = player.experienceToNext;
    player.addExperience(xp1);
    const xp2 = player.experienceToNext;
    expect(xp2).toBeGreaterThan(xp1);
  });

  it('should serialize to JSON', () => {
    const player = new Player('JSONTest', 'dark_wizard');
    const json = player.toJSON();

    expect(json.id).toBe(player.id);
    expect(json.name).toBe('JSONTest');
    expect(json.class).toBe('dark_wizard');
    expect(json.type).toBe('player');
    expect(json.x).toBe(100);
  });
});
