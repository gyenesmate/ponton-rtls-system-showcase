import * as THREE from 'three';

export class DetectionVisualizer {
  constructor(scene, palette, anchors, config) {
    this.scene = scene;
    this.palette = palette;
    this.anchors = anchors;
    this.config = config;
    this.trackedAssets = [];
  }

  registerTrackedAsset(object, {
    label = 'Tracked Asset',
    ringTarget = object,
    cycleOffset = 0,
    ringRadius = 1,
    ringY = 0.05,
    anchorCount = this.config.anchorsPerFix
  } = {}) {
    const linkSlots = [];
    const linkGroup = new THREE.Group();
    this.scene.add(linkGroup);

    for (let slotIndex = 0; slotIndex < anchorCount; slotIndex++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineDashedMaterial({
          color: this.palette.color4,
          transparent: true,
          opacity: 0,
          dashSize: 0.38,
          gapSize: 0.18,
          depthTest: false
        })
      );
      line.computeLineDistances();
      line.renderOrder = 30;
      linkGroup.add(line);

      const packets = [];
      for (let packetIndex = 0; packetIndex < 6; packetIndex++) {
        const packet = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 10, 10),
          new THREE.MeshBasicMaterial({
            color: this.palette.color4,
            transparent: true,
            opacity: 0,
            depthTest: false
          })
        );
        packet.renderOrder = 31;
        linkGroup.add(packet);
        packets.push(packet);
      }
      linkSlots.push({ line, packets });
    }

    const pulseGroup = this.createLocalizationPulse(ringRadius);
    this.scene.add(pulseGroup);

    const trackedAsset = {
      object, ringTarget, label, cycleOffset, ringRadius,
      ringY, anchorCount, linkGroup, linkSlots, pulseGroup
    };
    this.trackedAssets.push(trackedAsset);
    return trackedAsset;
  }

  update(elapsed) {
    this.updateAnchorIndicators(elapsed);

    this.trackedAssets.forEach((asset) => {
      if (!this.isObjectHierarchyVisible(asset.object)) {
        asset.linkGroup.visible = false;
        asset.pulseGroup.visible = false;
        return;
      }

      const cycleTime = (elapsed + asset.cycleOffset) % this.config.cycleDuration;
      const signalWorld = this.getSignalWorldPosition(asset.object);
      const ringWorld = this.getRingWorldPosition(asset.ringTarget, asset.ringY);

      if (cycleTime < this.config.linkDuration) {
        const phase = cycleTime / this.config.linkDuration;
        const linkOpacity = Math.sin(phase * Math.PI);
        const nearestAnchors = this.getNearestAnchors(signalWorld, asset.anchorCount);

        asset.linkGroup.visible = true;
        asset.pulseGroup.visible = false;

        nearestAnchors.forEach((anchor, slotIndex) => {
          this.updateSignalLinkSlot(
            asset.linkSlots[slotIndex],
            this.getAnchorSignalWorldPosition(anchor),
            signalWorld,
            elapsed,
            linkOpacity,
            slotIndex
          );
        });

        for (let index = nearestAnchors.length; index < asset.linkSlots.length; index++) {
          this.hideSignalLinkSlot(asset.linkSlots[index]);
        }
        return;
      }

      asset.linkGroup.visible = false;
      asset.linkSlots.forEach((slot) => this.hideSignalLinkSlot(slot));

      const pulseTime = cycleTime - this.config.linkDuration;
      if (pulseTime < this.config.pulseDuration) {
        this.updateLocalizationPulse(asset.pulseGroup, ringWorld, pulseTime / this.config.pulseDuration);
      } else {
        asset.pulseGroup.visible = false;
      }
    });
  }

  updateAnchorIndicators(elapsed) {
    this.anchors.forEach(({ indicatorMaterial }, index) => {
      indicatorMaterial.emissiveIntensity =
        0.55 + 0.35 * (0.5 + 0.5 * Math.sin(elapsed * 1.8 + index * 0.6));
    });
  }

  createLocalizationPulse(radius) {
    const pulseGroup = new THREE.Group();
    pulseGroup.visible = false;

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.66, 36),
      new THREE.MeshBasicMaterial({
        color: this.palette.color4,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    glow.rotation.x = -Math.PI / 2;
    pulseGroup.add(glow);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.5, radius * 0.62, 48),
      new THREE.MeshBasicMaterial({
        color: this.palette.color4,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    innerRing.rotation.x = -Math.PI / 2;
    pulseGroup.add(innerRing);

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.88, radius, 52),
      new THREE.MeshBasicMaterial({
        color: this.palette.color4,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    outerRing.rotation.x = -Math.PI / 2;
    pulseGroup.add(outerRing);

    pulseGroup.userData = { glow, innerRing, outerRing };
    return pulseGroup;
  }

  getSignalWorldPosition(object) {
    const local = object.userData.rtlsSignalLocalPosition || new THREE.Vector3(0, 1.5, 0);
    object.updateWorldMatrix(true, false);
    return object.localToWorld(local.clone());
  }

  getRingWorldPosition(object, ringY) {
    const position = new THREE.Vector3();
    object.getWorldPosition(position);
    position.y = ringY;
    return position;
  }

  getNearestAnchors(target, count) {
    return [...this.anchors]
      .sort((a, b) =>
        this.getAnchorSignalWorldPosition(a).distanceToSquared(target) -
        this.getAnchorSignalWorldPosition(b).distanceToSquared(target)
      )
      .slice(0, count);
  }

  getAnchorSignalWorldPosition(anchor) {
    anchor.group.updateWorldMatrix(true, false);
    return anchor.group.localToWorld(anchor.signalOriginLocal.clone());
  }

  isObjectHierarchyVisible(object) {
    let current = object;
    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }
    return true;
  }

  updateSignalLinkSlot(slot, start, end, elapsed, opacity, slotIndex) {
    slot.line.visible = true;
    slot.line.geometry.setFromPoints([start, end]);
    slot.line.computeLineDistances();
    slot.line.material.opacity = opacity * 0.7;

    slot.packets.forEach((packet, packetIndex) => {
      const travel = (elapsed * 1.9 + slotIndex * 0.24 + packetIndex * 0.14) % 1;
      packet.visible = true;
      packet.position.copy(start).lerp(end, travel);
      packet.material.opacity = opacity * (0.45 + 0.45 * Math.sin(travel * Math.PI));
    });
  }

  hideSignalLinkSlot(slot) {
    slot.line.visible = false;
    slot.packets.forEach((packet) => { packet.visible = false; });
  }

  updateLocalizationPulse(pulseGroup, worldPosition, progress) {
    const fade = 1 - progress;
    const scale = 0.72 + progress * 0.9;
    pulseGroup.visible = true;
    pulseGroup.position.copy(worldPosition);
    pulseGroup.scale.setScalar(scale);
    pulseGroup.userData.glow.material.opacity = 0.12 * fade;
    pulseGroup.userData.innerRing.material.opacity = 0.55 * fade;
    pulseGroup.userData.outerRing.material.opacity = 0.8 * fade;
  }
}
