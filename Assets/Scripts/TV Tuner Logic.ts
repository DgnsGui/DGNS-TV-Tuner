// TV Tuner Logic.ts – Version corrigée avec contrôles Palm en plein écran

@component
export class TVTunerLogic extends BaseScriptComponent {

    @input webViews: SceneObject[];
    @input buttons: SceneObject[];
    
    @input @hint("Noms des chaînes (doit correspondre au nombre de WebViews)") webViewNames: string[] = [];

    @input prevChannelButton: SceneObject;
    @input nextChannelButton: SceneObject;
    @input fullScreenButton: SceneObject;

    @input @hint("Texte affichant le nom de la chaîne actuelle") currentChannelText: Text;
    
    // Containers et navigation
    @input @hint("Container principal de l'interface TV") tv1Container: SceneObject;
    @input @hint("Container d'accueil au démarrage") welcomeContainer: SceneObject;
    @input @hint("Container d'aide") helpContainer: SceneObject;
    
    // Boutons de navigation
    @input @hint("Bouton '?' dans TV1 Container") helpButtonFromTV: SceneObject;
    @input @hint("Bouton '?' dans Welcome Container") helpButtonFromWelcome: SceneObject;
    @input @hint("Bouton 'Acknowledge' dans Help Container") acknowledgeHelpButton: SceneObject;
    @input @hint("Bouton 'Acknowledge' dans Welcome Container") acknowledgeWelcomeButton: SceneObject;

    // Vidéos d'arrière-plan dans Welcome Container
    @input @hint("Vidéo 1 dans Welcome Container") welcomeVideo1: SceneObject;
    @input @hint("Vidéo 2 dans Welcome Container (TriibG1retake)") welcomeVideo2: SceneObject;

    @input activeButtonScale: number = 1.2;
    @input inactiveButtonScale: number = 1.0;
    
    @input @hint("Durée des animations (secondes)") animationDuration: number = 0.25;

    // ═══════════════════════════════════════════════════════════════════════
    // PALM CONTROLS - Copie des contrôles dans la paume
    // ═══════════════════════════════════════════════════════════════════════
    @ui.group_start("Palm Buttons - Boutons de chaînes")
    @input @hint("Boutons de chaîne dans la paume (même ordre que buttons)") palmButtons: SceneObject[];
    @input @hint("Noms des chaînes pour la paume (optionnel, sinon utilise webViewNames)") palmWebViewNames: string[] = [];
    @ui.group_end
    
    @ui.group_start("Palm Controls - Contrôles de navigation")
    @input @hint("Bouton Chaîne précédente dans la paume") palmPrevChannelButton: SceneObject;
    @input @hint("Bouton Chaîne suivante dans la paume") palmNextChannelButton: SceneObject;
    @input @hint("Bouton Full Screen dans la paume") palmFullScreenButton: SceneObject;
    @input @hint("Texte du nom de chaîne dans la paume") palmCurrentChannelText: Text;
    @ui.group_end
    
    @ui.group_start("Palm Background Elements - Éléments de fond")
    @input @hint("Bouton de fond derrière le texte Current Channel") palmBackgroundCurrentChannel: SceneObject;
    @input @hint("Bouton de fond derrière le bouton Chan.") palmBackgroundChanButton: SceneObject;
    @ui.group_end
    
    @ui.group_start("Palm Appearance - Apparence")
    @input @hint("Scale des boutons actifs dans la paume") palmActiveButtonScale: number = 1.2;
    @input @hint("Scale des boutons inactifs dans la paume") palmInactiveButtonScale: number = 1.0;
    @ui.group_end

    // ═══════════════════════════════════════════════════════════════════════
    // FULL SCREEN - Interface plein écran
    // ═══════════════════════════════════════════════════════════════════════
    @ui.group_start("Full Screen - Plein écran")
    @input @hint("Container Full Screen principal") fullScreenContainer: SceneObject;
    @input @hint("WebViews Full Screen (même ordre que webViews)") fullScreenWebViews: SceneObject[];
    @input @hint("Boutons de chaîne Full Screen") fullScreenButtons: SceneObject[];
    
    @input @hint("Bouton Chaîne précédente Full Screen") fullScreenPrevChannelButton: SceneObject;
    @input @hint("Bouton Chaîne suivante Full Screen") fullScreenNextChannelButton: SceneObject;
    @input @hint("Bouton Exit Full Screen") exitFullScreenButton: SceneObject;
    @input @hint("Texte du nom de chaîne Full Screen") fullScreenCurrentChannelText: Text;
    
    @input @hint("Scale des boutons actifs Full Screen") fullScreenActiveButtonScale: number = 1.2;
    @input @hint("Scale des boutons inactifs Full Screen") fullScreenInactiveButtonScale: number = 1.0;
    @ui.group_end

    private currentChannelIndex: number = 0;
    private currentScreen: "welcome" | "tv" | "help" | "fullscreen" = "welcome";
    private previousScreen: "welcome" | "tv" = "welcome";
    private isTransitioning: boolean = false;
    private isFullScreen: boolean = false;

    onAwake() {
        print("=== TV Tuner Logic - Démarrage ===");

        // Vérifications de sécurité
        if (!this.webViews || this.webViews.length === 0) {
            print("ERREUR: webViews vide ou non assigné");
            return;
        }

        if (!this.buttons || this.buttons.length === 0) {
            print("ERREUR: buttons vide ou non assigné");
            return;
        }

        if (this.webViews.length !== this.buttons.length) {
            print("ERREUR: Nombre de WebViews et Buttons différent");
            return;
        }

        // Vérification Full Screen
        if (this.fullScreenWebViews && this.fullScreenWebViews.length > 0) {
            if (this.fullScreenWebViews.length !== this.webViews.length) {
                print("AVERTISSEMENT: Nombre de fullScreenWebViews différent");
            }
            print(`Full Screen activé avec ${this.fullScreenWebViews.length} chaînes`);
        }

        // Ajustement des noms de chaînes si nécessaire
        if (!this.webViewNames) {
            this.webViewNames = [];
        }
        
        while (this.webViewNames.length < this.webViews.length) {
            this.webViewNames.push(`Channel ${this.webViewNames.length + 1}`);
        }

        // Ajustement des noms Palm si nécessaire
        if (!this.palmWebViewNames) {
            this.palmWebViewNames = [];
        }
        
        if (this.palmWebViewNames.length === 0) {
            this.palmWebViewNames = [...this.webViewNames];
            print("Palm names copiés depuis webViewNames");
        } else {
            while (this.palmWebViewNames.length < this.webViews.length) {
                this.palmWebViewNames.push(`Channel ${this.palmWebViewNames.length + 1}`);
            }
        }

        // Vérification palmButtons
        if (this.palmButtons && this.palmButtons.length > 0) {
            print(`Palm buttons détectés: ${this.palmButtons.length}`);
            if (this.palmButtons.length !== this.webViews.length) {
                print("AVERTISSEMENT: palmButtons ne correspond pas au nombre de WebViews");
            }
        }

        try {
            this.setupAllButtonCallbacks();
            this.setupNavigationButtons();
            this.setupFullScreenButtons();
            this.initializeFirstChannel();
            this.showWelcomeScreen(false);
            this.updatePalmControlsVisibility();
            print("TV Tuner prêt – Affichage Welcome Screen");
        } catch (e) {
            print(`ERREUR lors de l'initialisation: ${e}`);
        }
    }

    private initializeFirstChannel(): void {
        try {
            this.currentChannelIndex = 0;
            this.updateButtonStates();
            this.updateCurrentChannelText();
            
            for (let i = 0; i < this.webViews.length; i++) {
                if (this.webViews[i]) {
                    this.enableTree(this.webViews[i], i === 0);
                }
            }
            
            // Initialiser Full Screen WebViews si disponibles
            if (this.fullScreenWebViews && this.fullScreenWebViews.length > 0) {
                for (let i = 0; i < this.fullScreenWebViews.length; i++) {
                    if (this.fullScreenWebViews[i]) {
                        this.enableTree(this.fullScreenWebViews[i], false);
                    }
                }
            }
            
            // Cacher le container Full Screen au démarrage
            if (this.fullScreenContainer) {
                this.fullScreenContainer.enabled = false;
            }
            
            print("Première chaîne initialisée avec bouton agrandi");
        } catch (e) {
            print(`ERREUR initializeFirstChannel: ${e}`);
        }
    }

    private setupAllButtonCallbacks(): void {
        this.setupChannelButtons();
        this.setupChannelNavigationButtons();
    }

    private setupNavigationButtons(): void {
        this.addTrigger(this.helpButtonFromTV, () => {
            if (!this.isTransitioning) {
                this.previousScreen = "tv";
                this.showHelpScreen();
            }
        });
        this.addTrigger(this.helpButtonFromWelcome, () => {
            if (!this.isTransitioning) {
                this.previousScreen = "welcome";
                this.showHelpScreen();
            }
        });
        
        this.addTrigger(this.acknowledgeHelpButton, () => {
            if (!this.isTransitioning) {
                if (this.previousScreen === "welcome") {
                    this.showWelcomeScreen(true);
                } else {
                    this.showTVScreen(true);
                }
            }
        });
        
        this.addTrigger(this.acknowledgeWelcomeButton, () => {
            if (!this.isTransitioning) {
                this.showTVScreen(false);
            }
        });
    }

    private setupFullScreenButtons(): void {
        // Bouton Full Screen interface principale
        this.addTrigger(this.fullScreenButton, () => this.enterFullScreen());
        
        // Bouton Full Screen paume
        if (this.palmFullScreenButton) {
            this.addTrigger(this.palmFullScreenButton, () => this.enterFullScreen());
        }
        
        // Bouton Exit Full Screen
        this.addTrigger(this.exitFullScreenButton, () => this.exitFullScreen());
        
        // Boutons de chaîne Full Screen
        if (this.fullScreenButtons && this.fullScreenButtons.length > 0) {
            this.setupButtonsArray(this.fullScreenButtons);
            print(`${this.fullScreenButtons.length} boutons Full Screen configurés`);
        }
        
        // Contrôles Full Screen
        if (this.fullScreenPrevChannelButton) {
            this.addTrigger(this.fullScreenPrevChannelButton, () => this.previousChannel());
        }
        if (this.fullScreenNextChannelButton) {
            this.addTrigger(this.fullScreenNextChannelButton, () => this.nextChannel());
        }
    }

    private setupChannelButtons(): void {
        // Boutons de l'interface principale
        this.setupButtonsArray(this.buttons);
        
        // Boutons dans la paume
        if (this.palmButtons && this.palmButtons.length > 0) {
            this.setupButtonsArray(this.palmButtons);
            print(`${this.palmButtons.length} boutons Palm configurés`);
        }
    }

    private setupButtonsArray(buttonArray: SceneObject[]): void {
        for (let i = 0; i < buttonArray.length; i++) {
            const btn = buttonArray[i];
            if (!btn) continue;
            
            const comps = btn.getComponents("Component.ScriptComponent");
            for (const c of comps) {
                const script: any = c;
                if (script.onTriggerUp) {
                    script.onTriggerUp(() => this.switchToChannel(i));
                    break;
                }
            }
        }
    }

    private setupChannelNavigationButtons(): void {
        // Interface principale
        this.addTrigger(this.prevChannelButton, () => this.previousChannel());
        this.addTrigger(this.nextChannelButton, () => this.nextChannel());
        
        // Paume
        if (this.palmPrevChannelButton) {
            this.addTrigger(this.palmPrevChannelButton, () => this.previousChannel());
        }
        if (this.palmNextChannelButton) {
            this.addTrigger(this.palmNextChannelButton, () => this.nextChannel());
        }
    }

    private addTrigger(btn: SceneObject, cb: () => void): void {
        if (!btn) return;
        const comps = btn.getComponents("Component.ScriptComponent");
        for (const c of comps) {
            const s: any = c;
            if (s.onTriggerUp) {
                s.onTriggerUp(cb);
                return;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTION DE LA VISIBILITÉ DES PALM CONTROLS - CORRIGÉ
    // ═══════════════════════════════════════════════════════════════════════
    
    private updatePalmControlsVisibility(): void {
        // Les contrôles Palm sont visibles en mode TV ET en mode plein écran
        const showPalmControls = (this.currentScreen === "tv" || this.currentScreen === "fullscreen");
        
        if (this.palmPrevChannelButton) {
            this.palmPrevChannelButton.enabled = showPalmControls;
        }
        if (this.palmNextChannelButton) {
            this.palmNextChannelButton.enabled = showPalmControls;
        }
        if (this.palmFullScreenButton) {
            this.palmFullScreenButton.enabled = showPalmControls;
        }
        if (this.palmCurrentChannelText) {
            this.palmCurrentChannelText.getSceneObject().enabled = showPalmControls;
        }
        
        // Gérer les éléments de fond Palm - NOUVEAU
        if (this.palmBackgroundCurrentChannel) {
            this.palmBackgroundCurrentChannel.enabled = showPalmControls;
        }
        if (this.palmBackgroundChanButton) {
            this.palmBackgroundChanButton.enabled = showPalmControls;
        }
        
        // Gérer les Palm Buttons de chaînes
        if (this.palmButtons && this.palmButtons.length > 0) {
            for (let i = 0; i < this.palmButtons.length; i++) {
                if (this.palmButtons[i]) {
                    this.palmButtons[i].enabled = showPalmControls;
                }
            }
        }
        
        print(`Contrôles Palm: ${showPalmControls ? "ACTIFS" : "CACHÉS"} (Screen: ${this.currentScreen})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Navigation entre écrans
    // ═══════════════════════════════════════════════════════════════════════
    
    private showWelcomeScreen(animated: boolean): void {
        print("=== Affichage Welcome Screen ===");
        this.currentScreen = "welcome";
        
        // Arrêter les WebViews du TV Container
        this.stopAllWebViews();
        
        if (animated) {
            this.transitionBetweenContainers(this.helpContainer, this.welcomeContainer);
            // Reprendre les vidéos après la transition
            const resumeEvt = this.createEvent("DelayedCallbackEvent");
            resumeEvt.bind(() => {
                this.playWelcomeVideos();
            });
            resumeEvt.reset(0.1);
        } else {
            this.setContainerVisibility(this.welcomeContainer, true);
            this.setContainerVisibility(this.tv1Container, false);
            this.setContainerVisibility(this.helpContainer, false);
            this.setContainerVisibility(this.fullScreenContainer, false);
            // Démarrer les vidéos du Welcome Container
            this.playWelcomeVideos();
        }
        
        this.updatePalmControlsVisibility();
    }
    
    private showTVScreen(animated: boolean): void {
        print("=== Affichage TV Screen ===");
        this.currentScreen = "tv";
        this.isFullScreen = false;
        
        // Arrêter les vidéos du Welcome Container
        this.stopWelcomeVideos();
        
        if (animated) {
            const fromContainer = this.previousScreen === "welcome" ? this.welcomeContainer : this.helpContainer;
            this.transitionBetweenContainers(fromContainer, this.tv1Container);
        } else {
            this.setContainerVisibility(this.tv1Container, true);
            this.setContainerVisibility(this.welcomeContainer, false);
            this.setContainerVisibility(this.helpContainer, false);
            this.setContainerVisibility(this.fullScreenContainer, false);
        }
        
        this.updatePalmControlsVisibility();
    }
    
    private showHelpScreen(): void {
        print("=== Affichage Help Screen ===");
        this.currentScreen = "help";
        
        // Arrêter les WebViews si on vient du TV
        if (this.previousScreen === "tv") {
            this.stopAllWebViews();
        }
        
        // Arrêter les vidéos du Welcome si on vient du Welcome
        if (this.previousScreen === "welcome") {
            this.stopWelcomeVideos();
        }
        
        const fromContainer = this.previousScreen === "welcome" ? this.welcomeContainer : this.tv1Container;
        this.transitionBetweenContainers(fromContainer, this.helpContainer);
        
        this.updatePalmControlsVisibility();
    }

    private transitionBetweenContainers(fromContainer: SceneObject, toContainer: SceneObject): void {
        if (!fromContainer || !toContainer || this.isTransitioning) {
            print("Transition ignorée");
            return;
        }

        this.isTransitioning = true;
        this.setContainerVisibility(toContainer, true);
        
        const switchEvt = this.createEvent("DelayedCallbackEvent");
        switchEvt.bind(() => {
            this.setContainerVisibility(fromContainer, false);
            this.isTransitioning = false;
        });
        switchEvt.reset(0.05);
    }

    private setContainerVisibility(container: SceneObject, visible: boolean): void {
        if (container) {
            container.enabled = visible;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Full Screen Mode - CORRIGÉ
    // ═══════════════════════════════════════════════════════════════════════
    
    private enterFullScreen(): void {
        if (this.isFullScreen || !this.fullScreenContainer || !this.fullScreenWebViews) {
            print("Full Screen non disponible");
            return;
        }
        
        print("=== Passage en Full Screen ===");
        this.isFullScreen = true;
        this.currentScreen = "fullscreen";
        
        // Arrêter la WebView normale
        const normalWebViewComp = this.findWebViewComponent(this.webViews[this.currentChannelIndex]);
        if (normalWebViewComp) {
            normalWebViewComp.stop();
        }
        this.enableTree(this.webViews[this.currentChannelIndex], false);
        
        // Cacher l'interface TV normale
        this.setContainerVisibility(this.tv1Container, false);
        
        // Afficher le container Full Screen
        this.setContainerVisibility(this.fullScreenContainer, true);
        
        // Activer la WebView Full Screen correspondante
        if (this.fullScreenWebViews[this.currentChannelIndex]) {
            this.enableTree(this.fullScreenWebViews[this.currentChannelIndex], true);
        }
        
        this.updateButtonStates();
        this.updateCurrentChannelText();
        this.updatePalmControlsVisibility(); // Les contrôles Palm restent actifs
    }
    
    private exitFullScreen(): void {
        if (!this.isFullScreen) return;
        
        print("=== Sortie du Full Screen ===");
        this.isFullScreen = false;
        this.currentScreen = "tv";
        
        // Arrêter la WebView Full Screen
        if (this.fullScreenWebViews[this.currentChannelIndex]) {
            const fullScreenWebViewComp = this.findWebViewComponent(this.fullScreenWebViews[this.currentChannelIndex]);
            if (fullScreenWebViewComp) {
                fullScreenWebViewComp.stop();
            }
            this.enableTree(this.fullScreenWebViews[this.currentChannelIndex], false);
        }
        
        // Cacher le container Full Screen
        this.setContainerVisibility(this.fullScreenContainer, false);
        
        // Réafficher l'interface TV normale
        this.setContainerVisibility(this.tv1Container, true);
        
        // Réactiver la WebView normale
        this.enableTree(this.webViews[this.currentChannelIndex], true);
        
        this.updateButtonStates();
        this.updateCurrentChannelText();
        this.updatePalmControlsVisibility(); // Les contrôles Palm restent actifs
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Gestion des vidéos Welcome Container
    // ═══════════════════════════════════════════════════════════════════════
    
    private playWelcomeVideos(): void {
        print("=== Démarrage des vidéos Welcome ===");
        
        try {
            if (this.welcomeVideo1) {
                const videoComp1 = this.findVideoTextureComponent(this.welcomeVideo1);
                if (videoComp1) {
                    if (videoComp1.resume) {
                        videoComp1.resume();
                        print("Vidéo 1 reprise (resume)");
                    } else {
                        videoComp1.play();
                        print("Vidéo 1 démarrée (play)");
                    }
                } else {
                    print("Vidéo 1 - composant non trouvé");
                }
            }
            
            if (this.welcomeVideo2) {
                const videoComp2 = this.findVideoTextureComponent(this.welcomeVideo2);
                if (videoComp2) {
                    if (videoComp2.resume) {
                        videoComp2.resume();
                        print("Vidéo 2 (TriibG1retake) reprise (resume)");
                    } else {
                        videoComp2.play();
                        print("Vidéo 2 (TriibG1retake) démarrée (play)");
                    }
                } else {
                    print("Vidéo 2 - composant non trouvé");
                }
            }
        } catch (e) {
            print(`Erreur playWelcomeVideos: ${e}`);
        }
    }
    
    private stopWelcomeVideos(): void {
        print("=== Arrêt des vidéos Welcome ===");
        
        try {
            if (this.welcomeVideo1) {
                const videoComp1 = this.findVideoTextureComponent(this.welcomeVideo1);
                if (videoComp1) {
                    videoComp1.pause();
                    print("Vidéo 1 arrêtée");
                }
            }
            
            if (this.welcomeVideo2) {
                const videoComp2 = this.findVideoTextureComponent(this.welcomeVideo2);
                if (videoComp2) {
                    videoComp2.pause();
                    print("Vidéo 2 (TriibG1retake) arrêtée");
                }
            }
        } catch (e) {
            print(`Erreur stopWelcomeVideos: ${e}`);
        }
    }
    
    private findVideoTextureComponent(obj: SceneObject): any {
        if (!obj) return null;
        
        // Chercher le composant Video Texture Provider
        const allComps = obj.getComponents("Component.ScriptComponent");
        for (const comp of allComps) {
            const c: any = comp;
            if (c.play && c.pause && c.videoStatus !== undefined) {
                return c;
            }
        }
        
        // Essayer avec MaterialMeshVisual qui contient la texture vidéo
        const meshVisuals = obj.getComponents("Component.MaterialMeshVisual");
        for (const visual of meshVisuals) {
            const mat = visual.mainMaterial;
            if (mat) {
                const mainPass = mat.mainPass;
                if (mainPass && mainPass.baseTex) {
                    const tex: any = mainPass.baseTex;
                    if (tex.control && tex.control.play && tex.control.pause) {
                        return tex.control;
                    }
                }
            }
        }
        
        // Chercher dans les enfants
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            const found = this.findVideoTextureComponent(obj.getChild(i));
            if (found) return found;
        }
        
        return null;
    }
    
    private stopAllWebViews(): void {
        print("=== Arrêt des WebViews ===");
        for (let i = 0; i < this.webViews.length; i++) {
            const webViewComp = this.findWebViewComponent(this.webViews[i]);
            if (webViewComp) {
                try {
                    webViewComp.stop();
                } catch (e) {
                    print(`Erreur arrêt WebView ${i}: ${e}`);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Gestion des chaînes
    // ═══════════════════════════════════════════════════════════════════════

    public nextChannel(): void {
        this.switchToChannel((this.currentChannelIndex + 1) % this.webViews.length);
    }

    public previousChannel(): void {
        this.switchToChannel((this.currentChannelIndex - 1 + this.webViews.length) % this.webViews.length);
    }

    private switchToChannel(index: number): void {
        if (index === this.currentChannelIndex || index < 0 || index >= this.webViews.length) return;

        print(`=== Switch chaîne ${this.currentChannelIndex} → ${index} ===`);

        if (this.isFullScreen) {
            // Mode Full Screen: gérer les WebViews Full Screen
            const oldFullScreenComp = this.findWebViewComponent(this.fullScreenWebViews[this.currentChannelIndex]);
            if (oldFullScreenComp) {
                oldFullScreenComp.stop();
            }
            this.enableTree(this.fullScreenWebViews[this.currentChannelIndex], false);

            this.currentChannelIndex = index;
            this.enableTree(this.fullScreenWebViews[index], true);
        } else {
            // Mode normal: gérer les WebViews normales
            const oldComp = this.findWebViewComponent(this.webViews[this.currentChannelIndex]);
            if (oldComp) {
                oldComp.stop();
            }
            this.enableTree(this.webViews[this.currentChannelIndex], false);

            this.currentChannelIndex = index;
            this.enableTree(this.webViews[index], true);
        }

        this.updateButtonStates();
        this.updateCurrentChannelText();
    }

    private updateCurrentChannelText(): void {
        const channelName = this.webViewNames[this.currentChannelIndex] || `Channel ${this.currentChannelIndex + 1}`;
        
        // Texte interface principale
        if (this.currentChannelText) {
            this.currentChannelText.text = channelName;
        }
        
        // Texte paume
        if (this.palmCurrentChannelText) {
            this.palmCurrentChannelText.text = channelName;
        }
        
        // Texte Full Screen
        if (this.fullScreenCurrentChannelText) {
            this.fullScreenCurrentChannelText.text = channelName;
        }
        
        print(`Chaîne affichée: ${channelName}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Utilitaires
    // ═══════════════════════════════════════════════════════════════════════

    private findWebViewComponent(obj: SceneObject): any {
        const scripts = obj.getComponents("Component.ScriptComponent");
        for (const s of scripts) {
            const script: any = s;
            if (script.executeJavaScript && script.setVolume && script.reload && script.stop) {
                return script;
            }
        }
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            const found = this.findWebViewComponent(obj.getChild(i));
            if (found) return found;
        }
        return null;
    }

    private enableTree(obj: SceneObject, enabled: boolean): void {
        obj.enabled = enabled;
        for (let i = 0; i < obj.getChildrenCount(); i++) {
            this.enableTree(obj.getChild(i), enabled);
        }
    }

    private updateButtonStates(): void {
        // Boutons interface principale
        if (!this.isFullScreen) {
            this.updateButtonsArray(this.buttons, this.activeButtonScale, this.inactiveButtonScale);
        }
        
        // Boutons paume
        if (this.palmButtons && this.palmButtons.length > 0) {
            this.updateButtonsArray(this.palmButtons, this.palmActiveButtonScale, this.palmInactiveButtonScale);
        }
        
        // Boutons Full Screen
        if (this.isFullScreen && this.fullScreenButtons && this.fullScreenButtons.length > 0) {
            this.updateButtonsArray(this.fullScreenButtons, this.fullScreenActiveButtonScale, this.fullScreenInactiveButtonScale);
        }
    }

    private updateButtonsArray(buttonArray: SceneObject[], activeScale: number, inactiveScale: number): void {
        for (let i = 0; i < buttonArray.length; i++) {
            if (!buttonArray[i]) continue;
            const scale = i === this.currentChannelIndex ? activeScale : inactiveScale;
            buttonArray[i].getTransform().setLocalScale(new vec3(scale, scale, scale));
        }
    }
}