import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

/**
 * High-performance, robust Three.js 3D Digital Twin of a Cable-Stayed Bridge & Tower asset.
 * Includes interactive zone raycasting, camera lerping, dynamic shaders/colors based on live AI risk,
 * glowing sensor node pucks, and multiple inspection render modes.
 */
export default function DigitalTwin3D({ zones, selectedZoneId, onSelectZone, viewMode = "solid" }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshMapRef = useRef({});
  const sensorPucksRef = useRef([]);
  const targetCameraPos = useRef(new THREE.Vector3(0, 18, 52));
  const targetLookAt = useRef(new THREE.Vector3(0, 4, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 4, 0));

  const [hoveredZone, setHoveredZone] = useState(null);

  // Define Zone 3D Camera Focus Targets
  const zoneFocusPoints = {
    "zone-1": { cam: new THREE.Vector3(-24, 6, 26), look: new THREE.Vector3(-24, 1, 0) },   // South Pier Foundation
    "zone-2": { cam: new THREE.Vector3(0, 12, 34), look: new THREE.Vector3(0, 4, 0) },      // Mid-Span Deck
    "zone-3": { cam: new THREE.Vector3(18, 38, 42), look: new THREE.Vector3(18, 20, 0) },   // North Pylon Tower
    "zone-4": { cam: new THREE.Vector3(8, 24, 28), look: new THREE.Vector3(8, 14, 0) },     // Stay Cables
    "zone-5": { cam: new THREE.Vector3(38, 10, 24), look: new THREE.Vector3(38, 4, 0) },    // North Abutment Joint
  };

  // Color Mapping Helper
  const getRiskColor = (riskLevel) => {
    if (riskLevel === "HIGH") return 0xef4444;    // Red
    if (riskLevel === "MEDIUM") return 0xf59e0b;  // Amber
    return 0x10b981;                              // Emerald Green
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.012);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 22, 58);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x38bdf8, 2.5, 90);
    blueLight.position.set(-20, 15, 10);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x818cf8, 2.0, 90);
    purpleLight.position.set(25, 25, 15);
    scene.add(purpleLight);

    // 5. Grid Ground & Water Plane
    const waterGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x051329,
      roughness: 0.1,
      metalness: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -6;
    water.receiveShadow = true;
    scene.add(water);

    const gridHelper = new THREE.GridHelper(200, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -5.9;
    scene.add(gridHelper);

    // 6. Build Structural Geometry for 5 Monitored Zones
    const meshes = {};

    // ----------------------------------------------------
    // ZONE 1: South Pier Foundation & Pile Cap (x: -24)
    // ----------------------------------------------------
    const z1Group = new THREE.Group();
    z1Group.userData = { zoneId: "zone-1", name: "South Pier Foundation" };

    const pierGeo = new THREE.CylinderGeometry(3.5, 4.2, 12, 16);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, metalness: 0.3 });
    const pierMesh = new THREE.Mesh(pierGeo, pierMat);
    pierMesh.position.set(-24, 0, 0);
    pierMesh.castShadow = true;
    pierMesh.receiveShadow = true;
    z1Group.add(pierMesh);

    // Foundation Base Cap
    const capGeo = new THREE.BoxGeometry(10, 2.5, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5, metalness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(-24, -4.5, 0);
    capMesh.castShadow = true;
    z1Group.add(capMesh);

    scene.add(z1Group);
    meshes["zone-1"] = { group: z1Group, materials: [pierMat, capMat] };

    // ----------------------------------------------------
    // ZONE 2: Main Roadway Deck Mid-Span (x: -16 to +16)
    // ----------------------------------------------------
    const z2Group = new THREE.Group();
    z2Group.userData = { zoneId: "zone-2", name: "Main Deck Mid-Span" };

    const deckMidGeo = new THREE.BoxGeometry(32, 1.6, 7.5);
    const deckMidMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.6 });
    const deckMidMesh = new THREE.Mesh(deckMidGeo, deckMidMat);
    deckMidMesh.position.set(0, 4.8, 0);
    deckMidMesh.castShadow = true;
    deckMidMesh.receiveShadow = true;
    z2Group.add(deckMidMesh);

    // Roadway Lane Markings
    const roadLineGeo = new THREE.BoxGeometry(30, 0.05, 0.4);
    const roadLineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const roadLine = new THREE.Mesh(roadLineGeo, roadLineMat);
    roadLine.position.set(0, 5.65, 0);
    z2Group.add(roadLine);

    // Guardrails
    const railGeo = new THREE.BoxGeometry(32, 0.8, 0.2);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 6.0, 3.6);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0, 6.0, -3.6);
    z2Group.add(rail1);
    z2Group.add(rail2);

    scene.add(z2Group);
    meshes["zone-2"] = { group: z2Group, materials: [deckMidMat] };

    // ----------------------------------------------------
    // Non-monitored Side Deck Spans (for complete bridge context)
    // ----------------------------------------------------
    const sideDeckGeo = new THREE.BoxGeometry(20, 1.4, 7.5);
    const sideDeckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
    
    const southDeck = new THREE.Mesh(sideDeckGeo, sideDeckMat);
    southDeck.position.set(-26, 4.8, 0);
    southDeck.castShadow = true;
    scene.add(southDeck);

    const northDeck = new THREE.Mesh(sideDeckGeo, sideDeckMat);
    northDeck.position.set(26, 4.8, 0);
    northDeck.castShadow = true;
    scene.add(northDeck);

    // ----------------------------------------------------
    // ZONE 3: North Pylon & Tower Saddle (x: 18)
    // ----------------------------------------------------
    const z3Group = new THREE.Group();
    z3Group.userData = { zoneId: "zone-3", name: "North Pylon Tower" };

    // Twin Vertical Tower Columns (A-frame style)
    const towerColGeo = new THREE.BoxGeometry(2.4, 38, 2.4);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.4 });
    
    const towerColLeft = new THREE.Mesh(towerColGeo, towerMat);
    towerColLeft.position.set(18, 14, 3.2);
    towerColLeft.rotation.x = -0.06;
    towerColLeft.castShadow = true;
    z3Group.add(towerColLeft);

    const towerColRight = new THREE.Mesh(towerColGeo, towerMat);
    towerColRight.position.set(18, 14, -3.2);
    towerColRight.rotation.x = 0.06;
    towerColRight.castShadow = true;
    z3Group.add(towerColRight);

    // Tower Cross Beams
    const crossBeamGeo = new THREE.BoxGeometry(2.6, 2.0, 7.0);
    const crossBeam1 = new THREE.Mesh(crossBeamGeo, towerMat);
    crossBeam1.position.set(18, 12, 0);
    const crossBeam2 = new THREE.Mesh(crossBeamGeo, towerMat);
    crossBeam2.position.set(18, 28, 0);
    z3Group.add(crossBeam1);
    z3Group.add(crossBeam2);

    // Tower Base Pier
    const northPierGeo = new THREE.CylinderGeometry(4.0, 4.8, 12, 16);
    const northPierMesh = new THREE.Mesh(northPierGeo, towerMat);
    northPierMesh.position.set(18, 0, 0);
    northPierMesh.castShadow = true;
    z3Group.add(northPierMesh);

    scene.add(z3Group);
    meshes["zone-3"] = { group: z3Group, materials: [towerMat] };

    // ----------------------------------------------------
    // ZONE 4: Cable-Stay Harness Stay-04 (Connecting Pylon to Deck)
    // ----------------------------------------------------
    const z4Group = new THREE.Group();
    z4Group.userData = { zoneId: "zone-4", name: "Cable-Stay Harness" };
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.9 });

    const cableAnchors = [
      { start: [18, 30, 2.5], end: [32, 5.5, 3.6] },
      { start: [18, 27, 2.5], end: [26, 5.5, 3.6] },
      { start: [18, 24, 2.5], end: [20, 5.5, 3.6] },
      { start: [18, 30, 2.5], end: [4, 5.5, 3.6] },
      { start: [18, 27, 2.5], end: [10, 5.5, 3.6] },
      { start: [18, 24, 2.5], end: [15, 5.5, 3.6] },
      // Opposite side cables
      { start: [18, 30, -2.5], end: [32, 5.5, -3.6] },
      { start: [18, 27, -2.5], end: [26, 5.5, -3.6] },
      { start: [18, 24, -2.5], end: [20, 5.5, -3.6] },
      { start: [18, 30, -2.5], end: [4, 5.5, -3.6] },
      { start: [18, 27, -2.5], end: [10, 5.5, -3.6] },
      { start: [18, 24, -2.5], end: [15, 5.5, -3.6] },
    ];

    cableAnchors.forEach(({ start, end }) => {
      const p1 = new THREE.Vector3(...start);
      const p2 = new THREE.Vector3(...end);
      const dist = p1.distanceTo(p2);
      const cableGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 8);
      const cable = new THREE.Mesh(cableGeo, cableMat);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      cable.position.copy(mid);
      cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      cable.castShadow = true;
      z4Group.add(cable);
    });

    scene.add(z4Group);
    meshes["zone-4"] = { group: z4Group, materials: [cableMat] };

    // ----------------------------------------------------
    // ZONE 5: North Abutment & Modular Expansion Joint (x: 36)
    // ----------------------------------------------------
    const z5Group = new THREE.Group();
    z5Group.userData = { zoneId: "zone-5", name: "North Abutment & Expansion Joint" };

    const abutmentGeo = new THREE.BoxGeometry(8, 12, 10);
    const abutmentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45, metalness: 0.3 });
    const abutmentMesh = new THREE.Mesh(abutmentGeo, abutmentMat);
    abutmentMesh.position.set(38, 0, 0);
    abutmentMesh.castShadow = true;
    abutmentMesh.receiveShadow = true;
    z5Group.add(abutmentMesh);

    // Expansion Joint Segment
    const jointGeo = new THREE.BoxGeometry(1.6, 2.0, 8.0);
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.8 });
    const jointMesh = new THREE.Mesh(jointGeo, jointMat);
    jointMesh.position.set(35.2, 5.0, 0);
    jointMesh.castShadow = true;
    z5Group.add(jointMesh);

    scene.add(z5Group);
    meshes["zone-5"] = { group: z5Group, materials: [abutmentMat, jointMat] };

    meshMapRef.current = meshes;

    // 7. Sensor Node Visual Pucks (Glowing indicators at key points)
    const puckPositions = [
      { id: "zone-1", pos: new THREE.Vector3(-24, 3.5, 2.5), name: "S-01 Tilt/Vib" },
      { id: "zone-2", pos: new THREE.Vector3(0, 6.2, 0), name: "S-02 Strain" },
      { id: "zone-3", pos: new THREE.Vector3(18, 28, 0), name: "S-03 Pylon Vib" },
      { id: "zone-4", pos: new THREE.Vector3(10, 14, 2.5), name: "S-04 Cable Load" },
      { id: "zone-5", pos: new THREE.Vector3(35.2, 6.2, 0), name: "S-05 Crack Joint" },
    ];

    const pucks = [];
    puckPositions.forEach((puckInfo) => {
      const puckGroup = new THREE.Group();
      puckGroup.position.copy(puckInfo.pos);

      // Glowing Sphere
      const sphereGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      puckGroup.add(sphere);

      // Pulsing Outer Ring
      const ringGeo = new THREE.RingGeometry(0.7, 0.9, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      puckGroup.add(ring);

      puckGroup.userData = { zoneId: puckInfo.id, ring, sphere };
      scene.add(puckGroup);
      pucks.push(puckGroup);
    });
    sensorPucksRef.current = pucks;

    // 8. Mouse Raycasting for Interactive Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const interactables = Object.values(meshMapRef.current).flatMap(m => m.group.children);
      const intersects = raycaster.intersectObjects(interactables, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData?.zoneId && parent.parent) {
          parent = parent.parent;
        }
        if (parent?.userData?.zoneId) {
          setHoveredZone(parent.userData.zoneId);
          containerRef.current.style.cursor = "pointer";
          return;
        }
      }
      setHoveredZone(null);
      containerRef.current.style.cursor = "default";
    };

    const handleClick = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const interactables = Object.values(meshMapRef.current).flatMap(m => m.group.children);
      const intersects = raycaster.intersectObjects(interactables, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData?.zoneId && parent.parent) {
          parent = parent.parent;
        }
        if (parent?.userData?.zoneId) {
          onSelectZone(parent.userData.zoneId);
        }
      }
    };

    // Orbit Drag Controls (Pure Three.js for responsiveness)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 60, theta: 0.3, phi: 1.1 };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e) => {
      handlePointerMove(e);
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.006;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.006));
    };

    const handleMouseUp = () => { isDragging = false; };
    const handleWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(18, Math.min(120, spherical.radius + e.deltaY * 0.05));
    };

    const dom = containerRef.current;
    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });
    dom.addEventListener("click", handleClick);

    // 9. Render Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Pulsing sensor puck rings
      sensorPucksRef.current.forEach((puck, idx) => {
        const ring = puck.userData.ring;
        const scale = 1.0 + Math.sin(time * 3.5 + idx) * 0.35;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = 0.8 - (scale - 1.0) * 0.8;
      });

      // Smooth Camera LERP towards target position
      if (!isDragging) {
        camera.position.lerp(targetCameraPos.current, 0.04);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        camera.lookAt(currentLookAt.current);
      } else {
        // Orbit update when user drags
        camera.position.x = targetLookAt.current.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        camera.position.y = targetLookAt.current.y + spherical.radius * Math.cos(spherical.phi);
        camera.position.z = targetLookAt.current.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.lookAt(targetLookAt.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("mousemove", handleMouseMove);
      dom.removeEventListener("mousedown", handleMouseDown);
      dom.removeEventListener("wheel", handleWheel);
      dom.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        dom.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update Camera Focus when Selected Zone changes
  useEffect(() => {
    if (selectedZoneId && zoneFocusPoints[selectedZoneId]) {
      const target = zoneFocusPoints[selectedZoneId];
      targetCameraPos.current.copy(target.cam);
      targetLookAt.current.copy(target.look);
    } else {
      // Default cinematic wide overview
      targetCameraPos.current.set(0, 20, 54);
      targetLookAt.current.set(0, 4, 0);
    }
  }, [selectedZoneId]);

  // Update Zone Colors & Materials when Telemetry / Risk updates or View Mode changes
  useEffect(() => {
    if (!zones || zones.length === 0 || !meshMapRef.current) return;

    zones.forEach((z) => {
      const meshObj = meshMapRef.current[z.id];
      if (!meshObj) return;

      const riskLevel = z.ai_health?.risk_level || "LOW";
      const colorHex = getRiskColor(riskLevel);
      const isSelected = selectedZoneId === z.id;
      const isHovered = hoveredZone === z.id;

      meshObj.materials.forEach((mat) => {
        if (viewMode === "wireframe") {
          mat.wireframe = true;
          mat.color.setHex(colorHex);
          mat.emissive.setHex(isSelected || isHovered ? colorHex : 0x000000);
          mat.emissiveIntensity = isSelected ? 0.6 : 0.2;
        } else if (viewMode === "heatmap") {
          mat.wireframe = false;
          // Heatmap Stress mode: high saturation glow
          mat.color.setHex(colorHex);
          mat.emissive.setHex(colorHex);
          mat.emissiveIntensity = isSelected ? 0.8 : (riskLevel === "HIGH" ? 0.6 : 0.25);
        } else {
          // Solid Structural Mode
          mat.wireframe = false;
          mat.color.setHex(colorHex);
          mat.emissive.setHex(isSelected || isHovered ? colorHex : (riskLevel === "HIGH" ? 0x991b1b : 0x000000));
          mat.emissiveIntensity = isSelected ? 0.4 : (riskLevel === "HIGH" ? 0.5 : 0.0);
        }
      });

      // Update Sensor Puck color
      const puck = sensorPucksRef.current.find(p => p.userData.zoneId === z.id);
      if (puck) {
        puck.userData.sphere.material.color.setHex(colorHex);
        puck.userData.ring.material.color.setHex(colorHex);
      }
    });
  }, [zones, selectedZoneId, hoveredZone, viewMode]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D HUD Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs font-mono flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-200 font-semibold uppercase tracking-wider">Cable-Stayed Bridge Twin v2.4</span>
        </div>
        {selectedZoneId && (
          <div className="bg-blue-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/40 text-xs font-mono text-blue-300">
            FOCUSED ZONE: <span className="font-bold text-white">{selectedZoneId.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Hover Info Tooltip */}
      {hoveredZone && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 text-xs shadow-xl animate-fade-in pointer-events-none">
          <p className="text-slate-400 font-mono">CLICK TO INSPECT</p>
          <p className="font-bold text-white text-sm capitalize">{hoveredZone.replace("-", " ")}</p>
        </div>
      )}

      {/* View Reset & Orbit Legend */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => onSelectZone(null)}
          className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition shadow cursor-pointer"
        >
          Reset View ↺
        </button>
      </div>
    </div>
  );
}
