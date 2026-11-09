import { generateScenario } from '../src/game/engine.ts';
import { getCustomerOrderDialogue } from '../src/components/game/3d/dialogue.ts';
import { resolveStudioAudio } from '../src/lib/dialogueAudio.ts';

for (let lvl = 1; lvl <= 10; lvl++) {
  const s = generateScenario(lvl, 0);
  const order = getCustomerOrderDialogue(s, 'en');
  const audio = resolveStudioAudio(order.text, order.customerId, order.characterVoice, 'customer');
  console.log(`Lvl ${lvl} [${order.customerId}]: "${order.text}" -> ${audio}`);
}
