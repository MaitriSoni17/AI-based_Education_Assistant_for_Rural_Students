import React, { Component } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { LanguageCode } from '../types';

interface SpeakButtonProps {
  text: string;
  lang: LanguageCode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface SpeakButtonState {
  isSpeaking: boolean;
}

export default class SpeakButton extends Component<SpeakButtonProps, SpeakButtonState> {
  private checkSpeechInterval: any = null;

  constructor(props: SpeakButtonProps) {
    super(props);
    this.state = {
      isSpeaking: false,
    };
  }

  componentDidUpdate(prevProps: SpeakButtonProps, prevState: SpeakButtonState) {
    if (!prevState.isSpeaking && this.state.isSpeaking) {
      if (this.checkSpeechInterval) clearInterval(this.checkSpeechInterval);
      this.checkSpeechInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          if (!window.speechSynthesis.speaking) {
            this.setState({ isSpeaking: false });
          }
        } else {
          this.setState({ isSpeaking: false });
        }
      }, 500);
    } else if (prevState.isSpeaking && !this.state.isSpeaking) {
      if (this.checkSpeechInterval) {
        clearInterval(this.checkSpeechInterval);
        this.checkSpeechInterval = null;
      }
    }
  }

  componentWillUnmount() {
    stopSpeaking();
    if (this.checkSpeechInterval) {
      clearInterval(this.checkSpeechInterval);
      this.checkSpeechInterval = null;
    }
  }

  private handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (this.state.isSpeaking) {
      stopSpeaking();
      this.setState({ isSpeaking: false });
    } else {
      this.setState({ isSpeaking: true });
      speakText(this.props.text, this.props.lang);
    }
  };

  render() {
    const { className = "", size = "sm" } = this.props;
    const { isSpeaking } = this.state;
    const buttonSizeClass = size === 'sm' ? 'p-1 w-7 h-7' : size === 'md' ? 'p-2 w-10 h-10' : 'p-3 w-12 h-12';
    const iconSizeClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

    return (
      <button
        type="button"
        onClick={this.handleSpeak}
        className={`inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all border border-emerald-200 cursor-pointer shadow-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none ${buttonSizeClass} ${className}`}
        title={isSpeaking ? "Stop Speaking" : "Listen aloud"}
      >
        {isSpeaking ? (
          <VolumeX className={`${iconSizeClass} text-rose-500 animate-pulse`} />
        ) : (
          <Volume2 className={`${iconSizeClass} hover:scale-110 active:scale-95 transition-transform`} />
        )}
      </button>
    );
  }
}
