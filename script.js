/**
 * Three.js Visual Core Engine - "Our Process" Redesign
 */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#visual-core-canvas');
  if (!canvas) return;

  // 1. Scene setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 12;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xff5a5f, 2, 50);
  pointLight.position.set(5, 5, 8);
  scene.add(pointLight);

  // 2. System Components
  const currentGroup = new THREE.Group();
  scene.add(currentGroup);

  // State Objects
  const states = {
    discovery: null,
    designing: null,
    production: null,
    deployment: null
  };

  // Discovery State: Scanning Points
  const discoveryGeo = new THREE.IcosahedronGeometry(3, 2);
  const discoveryMat = new THREE.PointsMaterial({ color: 0xff5a5f, size: 0.05 });
  states.discovery = new THREE.Points(discoveryGeo, discoveryMat);

  // Designing State: Structural Wireframe
  const designingGeo = new THREE.BoxGeometry(4, 4, 4, 4, 4, 4);
  const designingMat = new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 });
  states.designing = new THREE.Mesh(designingGeo, designingMat);

  // Testing State: Pulsing Stability Rings
  const testingGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(2 + i * 0.8, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    testingGroup.add(ring);
  }
  states.production = testingGroup;

  // Deployment State: Expanding Sphere
  const deploymentGeo = new THREE.SphereGeometry(3.5, 32, 32);
  const deploymentMat = new THREE.MeshPhongMaterial({
    color: 0xff5a5f,
    wireframe: true,
    emissive: 0xff5a5f,
    emissiveIntensity: 0.5
  });
  states.deployment = new THREE.Mesh(deploymentGeo, deploymentMat);

  let activeState = 'discovery';
  currentGroup.add(states.discovery);

  // 3. Logic & Scroll Sync
  const steps = document.querySelectorAll('.process-step');
  const stateLabel = document.getElementById('visual-state-label');

  const updateVisualState = (newState) => {
    if (activeState === newState) return;

    // Remove current
    currentGroup.remove(states[activeState]);

    // Add new
    activeState = newState;
    currentGroup.add(states[activeState]);

    // Update label
    if (stateLabel) stateLabel.textContent = newState.toUpperCase();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stage = entry.target.getAttribute('data-stage');
        steps.forEach(s => s.classList.remove('active'));
        entry.target.classList.add('active');
        updateVisualState(stage);
      }
    });
  }, { threshold: 0.6 });

  steps.forEach(step => observer.observe(step));

  // 4. Animation Frame
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const animate = () => {
    requestAnimationFrame(animate);

    // Subtle parallax
    currentGroup.rotation.y += (mouseX * 0.2 - currentGroup.rotation.y) * 0.05;
    currentGroup.rotation.x += (-mouseY * 0.2 - currentGroup.rotation.x) * 0.05;

    // Constant ambient rotation
    currentGroup.rotation.z += 0.001;

    // Specific animations per state
    if (activeState === 'discovery') {
      states.discovery.rotation.y += 0.005;
    } else if (activeState === 'designing') {
      states.designing.rotation.y += 0.003;
    } else if (activeState === 'production') {
      states.production.children.forEach((ring, i) => {
        ring.rotation.z += 0.01 * (i + 1);
        ring.scale.setScalar(1 + Math.sin(Date.now() * 0.002 + i) * 0.05);
      });
    } else if (activeState === 'deployment') {
      states.deployment.rotation.y -= 0.005;
      states.deployment.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }

    renderer.render(scene, camera);
  };

  animate();

  // 5. Cleanup & Resize
  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
});
