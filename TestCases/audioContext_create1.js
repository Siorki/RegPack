try {
			this.webAudioSupport = true;
			if (typeof AudioContext !== "undefined") {
				this.audioContext = new AudioContext()
			} else if (typeof webkitAudioContext !== "undefined") {
				this.audioContext = new webkitAudioContext()
			} else {
				this.webAudioSupport = false
			}
		} catch (e) {
			this.webAudioSupport = false
		}
	}
this.audioContext.createBuffer(2,22050,22050);